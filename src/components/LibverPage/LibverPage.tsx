import {
  Content,
  ContentHeader,
  PageWithHeader,
  SupportButton,
  TableColumn,
  TableProps,
} from '@backstage/core-components';
import {configApiRef, useApi} from '@backstage/core-plugin-api';
import {
  CatalogFilterLayout,
  EntityKindPicker,
  EntityListProvider,
  EntityOwnerPicker,
  EntityTagPicker,
  EntityTypePicker,
} from '@backstage/plugin-catalog-react';
import React, {ReactNode} from 'react';
import {LibverTable} from '../LibverTable';
import {EntityLibraryFilterPicker} from './EntityLibraryFilter';
import {LibverTableRow} from '../../types';

/**
 * Props for root catalog pages.
 * @public
 */
export interface LibverPageProps {
  title?: string;
  topComponents?: ReactNode;
  columns?: TableColumn<LibverTableRow>[];
  tableOptions?: TableProps<LibverTableRow>['options'];
}

export function LibverPageContent(props: LibverPageProps) {
  return (
    <EntityListProvider>
      <Content>
        <ContentHeader
          title={props.title || 'JFrog Repository artifacts'}
          // titleComponent={<EntityKindPicker initialFilter={initialKind} />}
        >
          {props.topComponents}
          <SupportButton>All your software catalog libraries</SupportButton>
        </ContentHeader>
        <CatalogFilterLayout>
          <CatalogFilterLayout.Filters>
            <EntityKindPicker initialFilter={'Component'} hidden={true} />
            <EntityLibraryFilterPicker />
            <EntityTypePicker />
            <EntityOwnerPicker />
            <EntityTagPicker />
          </CatalogFilterLayout.Filters>
          <CatalogFilterLayout.Content>
            <LibverTable
              columns={props.columns}
              tableOptions={props.tableOptions}
            />
          </CatalogFilterLayout.Content>
        </CatalogFilterLayout>
      </Content>
    </EntityListProvider>
  );
}

export function LibverPage(props: LibverPageProps) {
  const orgName =
    useApi(configApiRef).getOptionalString('organization.name') ?? 'Backstage';

  return (
    <PageWithHeader title={`${orgName} Libraries`} themeId="home">
      {LibverPageContent(props)}
    </PageWithHeader>
  );
}
