import {
  CATALOG_FILTER_EXISTS,
  DefaultEntityFilters,
  EntityFilter,
  useEntityList,
} from '@backstage/plugin-catalog-react';
import { ENTITY_ARTIFACT } from '../../types';
import { useEffect } from 'react';

class EntityLibraryFilter implements EntityFilter {
    getCatalogFilters(): Record<string, string | symbol | (string | symbol)[]> {
        return {
            [`metadata.annotations.${ENTITY_ARTIFACT}`]: CATALOG_FILTER_EXISTS,
        };
    }
}

export type CustomFilters = DefaultEntityFilters & {
    libraryFilters?: EntityLibraryFilter
};

export const EntityLibraryFilterPicker = () => {
    const {
        updateFilters
    } = useEntityList<CustomFilters>();

    useEffect(() => {
        const entityLibraryFilter = new EntityLibraryFilter();
        updateFilters({
            libraryFilters: entityLibraryFilter,
        });
    }, [updateFilters]);

    return null;
};