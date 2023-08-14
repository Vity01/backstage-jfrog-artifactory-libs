/*
 * Copyright 2023 The Backstage Authors
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
import {
  createComponentExtension,
  createPlugin,
  createRoutableExtension,
} from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';
import { scaffolderPlugin } from '@backstage/plugin-scaffolder';
import { createScaffolderFieldExtension } from '@backstage/plugin-scaffolder-react';
import { ArtifactRepositoryPicker } from './components/ArtifactRepositoryPicker';
import { ArtifactRepositoryPickerSchema } from './components/ArtifactRepositoryPicker/schema';

export const jfrogArtifactoryLibsPlugin = createPlugin({
  id: 'jfrog-artifactory-libs',
  routes: {
    root: rootRouteRef,
  },
});

export const LibArtifactCard = jfrogArtifactoryLibsPlugin.provide(
  createComponentExtension({
    name: 'LibArtifactCard',
    component: {
      lazy: () =>
        import('./components/LibArtifactCard').then(m => m.LibArtifactCard),
    },
  }),
);

export const JfrogArtifactoryLibsPage = jfrogArtifactoryLibsPlugin.provide(
  createRoutableExtension({
    name: 'JfrogArtifactoryLibsPage',
    component: () =>
      import('./components/LibArtifactCard').then(m => m.LibArtifactCard),
    mountPoint: rootRouteRef,
  }),
);

/**
 * A field extension for selecting an Entity that exists in the Catalog.
 *
 * @public
 */
export const ArtifactRepositoryPickerFieldExtension = scaffolderPlugin.provide(
  createScaffolderFieldExtension({
    component: ArtifactRepositoryPicker,
    name: 'ArtifactRepositoryPicker',
    schema: ArtifactRepositoryPickerSchema,
  }),
);
