/*
 * Copyright 2021 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React from 'react';
import {
  humanizeEntityRef,
  EntityRefLink,
  EntityRefLinks,
} from '@backstage/plugin-catalog-react';
import { Chip } from '@material-ui/core';
import {Link, OverflowTooltip, TableColumn} from '@backstage/core-components';
import { Entity } from '@backstage/catalog-model';
import { JsonArray } from '@backstage/types';
import {getBrowseArtifactUrl, getBrowserVersionUrl} from "../LibVerView/LibVerView";
import {LibverTableRow} from "../../types";

// The columnFactories symbol is not directly exported, but through the
// CatalogTable.columns field.
/** @public */
export const columnFactories = Object.freeze({
  createNameColumn(options?: {
    defaultKind?: string;
  }): TableColumn<LibverTableRow> {
    function formatContent(entity: Entity): string {
      return (
        entity.metadata?.title ||
        humanizeEntityRef(entity, {
          defaultKind: options?.defaultKind,
        })
      );
    }

    return {
      title: 'Name',
      field: 'resolved.name',
      width: '20%',
      highlight: true,
      customSort({ entity: entity1 }, { entity: entity2 }) {
        // TODO: We could implement this more efficiently by comparing field by field.
        // This has similar issues as above.
        return formatContent(entity1).localeCompare(formatContent(entity2));
      },
      render: ({ entity }) => (
        <EntityRefLink
          entityRef={entity}
          defaultKind={options?.defaultKind || 'Component'}
          title={entity.metadata?.title}
        />
      ),
    };
  },
  // createSystemColumn(): TableColumn<LibverTableRow> {
  //   return {
  //     title: 'System',
  //     field: 'resolved.partOfSystemRelationTitle',
  //     render: ({ resolved }) => (
  //       <EntityRefLinks
  //         entityRefs={resolved.partOfSystemRelations}
  //         defaultKind="system"
  //       />
  //     ),
  //   };
  // },
  createOwnerColumn(): TableColumn<LibverTableRow> {
    return {
      title: 'Owner',
      field: 'resolved.ownedByRelationsTitle',
      width: '20%',
      render: ({ resolved }) => (
        <EntityRefLinks
          entityRefs={resolved.ownedByRelations}
          defaultKind="group"
        />
      ),
    };
  },
  createSpecTargetsColumn(): TableColumn<LibverTableRow> {
    return {
      title: 'Targets',
      field: 'entity.spec.targets',
      render: ({ entity }) => (
        <>
          {(entity?.spec?.targets || entity?.spec?.target) && (
            <OverflowTooltip
              text={(
                (entity!.spec!.targets as JsonArray) || [entity.spec.target]
              ).join(', ')}
              placement="bottom-start"
            />
          )}
        </>
      ),
    };
  },
  createSpecTypeColumn(): TableColumn<LibverTableRow> {
    return {
      title: 'Type',
      field: 'entity.spec.type',
      hidden: true,
      width: 'auto',
    };
  },
  createVersionColumn(artifactoryUrl: string): TableColumn<LibverTableRow> {
    return {
      title: 'Version',
      field: 'resolved.artifactInfo.lib.version',
      render: ({ resolved }) => {
        if (resolved.artifactInfo) {
          return (
              <Link
                  to={getBrowserVersionUrl(
                      artifactoryUrl,
                      resolved.artifactInfo.lib,
                  )}
                  target="_blank"
              >
                {resolved.artifactInfo.lib.version || '?'}
              </Link>
          );
        }
        return null;
      },
      hidden: false,
      width: 'auto',
    };
  },
  createArtifactColumn(artifactoryUrl: string): TableColumn<LibverTableRow> {
    return {
      title: 'Artifact',
      field: 'resolved.artifactInfo.lib.artifact',
      render: ({ resolved }) => {
        if (resolved.artifactInfo) {
          return (
            <Link
              to={getBrowseArtifactUrl(
                artifactoryUrl,
                resolved.artifactInfo.lib,
              )}
              target="_blank"
            >
              {resolved.artifactInfo.lib.artifactFullName ||
                resolved.artifactInfo.lib.artifact}
            </Link>
          );
        }
        return null;
      },
      hidden: false,
      width: 'auto',
    };
  },
  createSpecLifecycleColumn(): TableColumn<LibverTableRow> {
    return {
      title: 'Lifecycle',
      field: 'entity.spec.lifecycle',
    };
  },
  createMetadataDescriptionColumn(): TableColumn<LibverTableRow> {
    return {
      title: 'Description',
      field: 'entity.metadata.description',
      render: ({ entity }) => (
        <OverflowTooltip
          text={entity.metadata.description}
          placement="bottom-start"
        />
      ),
      width: 'auto',
    };
  },
  createTagsColumn(): TableColumn<LibverTableRow> {
    return {
      title: 'Tags',
      field: 'entity.metadata.tags',
      cellStyle: {
        padding: '0px 16px 0px 20px',
      },
      render: ({ entity }) => (
        <>
          {entity.metadata.tags &&
            entity.metadata.tags.map(t => (
              <Chip
                key={t}
                label={t}
                size="small"
                variant="outlined"
                style={{ marginBottom: '0px' }}
              />
            ))}
        </>
      ),
      width: 'auto',
    };
  },
  createTitleColumn(options?: {
    hidden?: boolean;
  }): TableColumn<LibverTableRow> {
    return {
      title: 'Title',
      field: 'entity.metadata.title',
      hidden: options?.hidden,
      searchable: true,
    };
  },
  createLabelColumn(
    key: string,
    options?: { title?: string; defaultValue?: string },
  ): TableColumn<LibverTableRow> {
    return {
      title: options?.title || 'Label',
      field: 'entity.metadata.labels',
      cellStyle: {
        padding: '0px 16px 0px 20px',
      },
      render: ({ entity }: { entity: Entity }) => {
        const labels: Record<string, string> | undefined =
          entity.metadata?.labels;
        const specifiedLabelValue =
          (labels && labels[key]) || options?.defaultValue;
        return (
          <>
            {specifiedLabelValue && (
              <Chip
                key={specifiedLabelValue}
                label={specifiedLabelValue}
                size="small"
                variant="outlined"
              />
            )}
          </>
        );
      },
      width: 'auto',
    };
  },
  createNamespaceColumn(): TableColumn<LibverTableRow> {
    return {
      title: 'Namespace',
      field: 'entity.metadata.namespace',
      width: 'auto',
    };
  },
});
