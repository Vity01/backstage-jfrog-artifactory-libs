import {
  Entity,
  RELATION_OWNED_BY,
  RELATION_PART_OF,
} from '@backstage/catalog-model';
import {
  CodeSnippet,
  ResponseErrorPanel,
  Table,
  TableColumn,
  TableProps,
  WarningPanel,
} from '@backstage/core-components';
import {
  DefaultEntityFilters,
  getEntityRelations,
  humanizeEntityRef,
  useEntityList,
} from '@backstage/plugin-catalog-react';
import { capitalize } from 'lodash';
import React, { ReactNode, useMemo, useRef, useState } from 'react';
import { columnFactories } from './columns';
import pluralize from 'pluralize';
import { ConfigApi, configApiRef, useApi } from '@backstage/core-plugin-api';
import useAsync from 'react-use/lib/useAsync';
import { LibVerTabbedContent } from '../LibVerTabbedContent';
import { ArtifactInfo } from '../LibArtifactCard/api';
import { Grid } from '@material-ui/core';
import { CustomFilters } from '../LibverPage/EntityLibraryFilter';
import { libraryInfo } from '../LibArtifactCard/libraryInfo';
import { LibverTableRow } from '../../types';

/**
 * Props for {@link LibverTable}.
 *
 * @public
 */
export interface LibverTableProps {
  columns?: TableColumn<LibverTableRow>[];
  actions?: TableProps<LibverTableRow>['actions'];
  tableOptions?: TableProps<LibverTableRow>['options'];
  emptyContent?: ReactNode;
  subtitle?: string;
}

const refCompare = (a: LibverTableRow, b: LibverTableRow) => {
  const toRef = (entity: Entity) =>
    entity.metadata.title ||
    humanizeEntityRef(entity, {
      defaultKind: 'Component',
    });

  return toRef(a.entity).localeCompare(toRef(b.entity));
};

async function loadEntityItemData(
  entity: Entity,
  config: ConfigApi,
): Promise<LibverTableRow> {
  const partOfSystemRelations = getEntityRelations(entity, RELATION_PART_OF, {
    kind: 'system',
  });
  const ownedByRelations = getEntityRelations(entity, RELATION_OWNED_BY);

  let artifactInfo;
  try {
    artifactInfo = await libraryInfo(entity, config);
  } catch (e) {
    console.error(e);
    artifactInfo = undefined;
  }
  return {
    entity,
    resolved: {
      name: humanizeEntityRef(entity, {
        defaultKind: 'Component',
      }),
      artifactInfo: artifactInfo,
      ownedByRelationsTitle: ownedByRelations
        .map(r => humanizeEntityRef(r, { defaultKind: 'group' }))
        .join(', '),
      ownedByRelations,
      partOfSystemRelationTitle: partOfSystemRelations
        .map(r =>
          humanizeEntityRef(r, {
            defaultKind: 'system',
          }),
        )
        .join(', '),
      partOfSystemRelations,
    },
  };
}

function TableComponent(
  entities: Entity[],
  columns: TableColumn<LibverTableRow>[] | undefined,
  defaultColumns: TableColumn<LibverTableRow>[],
  showTypeColumn: boolean,
  filters: DefaultEntityFilters,
  titlePreamble: string,
  loading1: boolean,
  emptyContent?: ReactNode,
  tableOptions?: TableProps<LibverTableRow>['options'] | undefined,
  subtitle?: string,
) {
  const [rows, setRows] = useState<LibverTableRow[]>([]);
  const [selectedRows, setSelectedRows] = useState<ArtifactInfo[]>([]);
  const config = useApi(configApiRef);
  const tableRef = useRef<any>(); // not sure if there's a better type for this

  const artifactoryUrl = useMemo(() => {
    return config.getString('jfrog.artifactory.url');
  }, [config]);

  const { loading, error } = useAsync(async () => {
    const results: LibverTableRow[] = [];
    const libverTableRows = await Promise.allSettled(
      entities.map(entity => loadEntityItemData(entity, config)),
    );
    libverTableRows.forEach(result => {
      if (result.status === 'fulfilled') {
        // Handle fulfilled promise
        results.push(result.value);
      } else if (result.status === 'rejected') {
        // Handle rejected promise
        console.error('Rejected:', result.reason);
      }
    });
    setRows(results.sort(refCompare));
  }, [entities, config]);

  if (error) {
    return <ResponseErrorPanel error={error} />;
  }

  const typeColumn = (columns || defaultColumns).find(c => c.title === 'Type');
  if (typeColumn) {
    typeColumn.hidden = !showTypeColumn;
  }
  const showPagination = rows.length > 20;
  const currentKind = filters.kind?.value || '';
  const currentType = filters.type?.value || '';
  const titleDisplay = [titlePreamble, currentType, pluralize(currentKind)]
    .filter(s => s)
    .join(' ');

  return (
    <Grid container>
      <Grid item xs={8}>
        <Table<LibverTableRow>
          isLoading={loading1 || loading}
          columns={columns || defaultColumns}
          tableRef={tableRef}
          options={{
            paging: showPagination,
            pageSize: 1000,
            selection: true,
            // rowStyle: rowData => ({
            //   cursor: 'pointer',
            //   backgroundColor: selectedRows.includes(rowData.id)
            //     ? '#e0f7fa'
            //     : 'inherit',
            // }),
            actionsColumnIndex: -1,
            loadingType: 'linear',
            showEmptyDataSourceMessage: !loading,
            // padding: 'dense',
            pageSizeOptions: [25, 50, 100, 200, 1000],
            ...tableOptions,
          }}
          onSelectionChange={rs => {
            const items = rs
              .filter(item => item.resolved.artifactInfo)
              .map(item => item.resolved.artifactInfo as ArtifactInfo);
            console.log('Items ', items);
            setSelectedRows(items);
          }}
          onRowClick={(_event, rowData) => {
            console.log('Event', rowData);
            if (tableRef.current) {
              // noinspection JSUnresolvedReference
              tableRef.current.dataManager.changeRowSelected(
                !(rowData as any).tableData.checked,
                [(rowData as any).tableData.id],
              );
              // noinspection JSUnresolvedReference
              tableRef.current.setState(
                tableRef.current.dataManager.getRenderState(),
                function () {
                  return tableRef.current.onSelectionChange();
                },
              );
            }
          }}
          title={`${titleDisplay} (${entities.length})`}
          data={rows}
          // actions={actions || defaultActions}
          subtitle={subtitle}
          emptyContent={emptyContent}
        />
      </Grid>

      <Grid item xs={4}>
        <LibVerTabbedContent
          artifactoryUrl={artifactoryUrl}
          props={{
            autohideTabs: true,
            showPip: true,
            showDockerfile: true,
            showGradle: true,
            showSbt: true,
            showMaven: true,
            showBrowseRepositoryLink: true,
            browseRepositoryLinkTitle: 'Open repository',
            title: 'Dependency generator',
            browseLink: (artifactoryLink, _artifactInfos) => artifactoryLink,
          }}
          loading={loading1 || loading}
          artifactInfo={selectedRows}
        />
      </Grid>
    </Grid>
  );
}

export const LibverTable = (props: LibverTableProps) => {
  const { columns, tableOptions, subtitle, emptyContent } = props;
  // const { isStarredEntity, toggleStarredEntity } = useStarredEntities();
  const { loading, error, entities, filters } = useEntityList<CustomFilters>();

  const config = useApi(configApiRef);

  const defaultColumns: TableColumn<LibverTableRow>[] = useMemo(() => {
    const artifactoryUrl = config.getString('jfrog.artifactory.url');
    return [
      columnFactories.createTitleColumn({ hidden: true }),
      columnFactories.createNameColumn({ defaultKind: 'Component' }),
      columnFactories.createNamespaceColumn(),
      columnFactories.createOwnerColumn(),
      columnFactories.createArtifactColumn(artifactoryUrl),
      columnFactories.createVersionColumn(artifactoryUrl),
      columnFactories.createTagsColumn(),
    ];
  }, [config]);

  const showTypeColumn = filters.type === undefined;
  // TODO(timbonicus): remove the title from the CatalogTable once using EntitySearchBar
  const titlePreamble = capitalize(filters.user?.value ?? 'all');

  if (error) {
    return (
      <div>
        <WarningPanel
          severity="error"
          title="Could not fetch catalog entities."
        >
          <CodeSnippet language="text" text={error.toString()} />
        </WarningPanel>
      </div>
    );
  }

  // const rows = entities.sort(refCompare).map(entity => {
  //   const partOfSystemRelations = getEntityRelations(entity, RELATION_PART_OF, {
  //     kind: 'system',
  //   });
  //   const ownedByRelations = getEntityRelations(entity, RELATION_OWNED_BY);
  //
  //   return {
  //     entity,
  //     resolved: {
  //       name: humanizeEntityRef(entity, {
  //         defaultKind: 'Component',
  //       }),
  //       ownedByRelationsTitle: ownedByRelations
  //         .map(r => humanizeEntityRef(r, { defaultKind: 'group' }))
  //         .join(', '),
  //       ownedByRelations,
  //       partOfSystemRelationTitle: partOfSystemRelations
  //         .map(r =>
  //           humanizeEntityRef(r, {
  //             defaultKind: 'system',
  //           }),
  //         )
  //         .join(', '),
  //       partOfSystemRelations,
  //     },
  //   };
  // });
  return TableComponent(
    entities,
    columns,
    defaultColumns,
    showTypeColumn,
    filters,
    titlePreamble,
    loading,
    emptyContent,
    tableOptions,
    subtitle,
  );
};

LibverTable.columns = columnFactories;
