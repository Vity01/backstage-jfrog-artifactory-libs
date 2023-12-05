/*
 * Copyright 2022 The Backstage Authors
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
import { z } from 'zod';
import {CustomFieldExtensionSchema, makeFieldSchemaFromZod} from '@backstage/plugin-scaffolder';

/**
 * @public
 */
export const entityQueryFilterExpressionSchema = z.record(
  z
    .string()
    .or(z.object({ exists: z.boolean().optional() }))
    .or(z.array(z.string())),
);

/**
 * @public
 */
export const RepositoryPickerFieldSchema = makeFieldSchemaFromZod(
  z.string(),
  z.object({
    /**
     * @deprecated Use `catalogFilter` instead.
     */
    excludedRegex: z
      .array(z.string())
      .optional()
      .describe(
        'Array of regular expressions for filtering repositories out by name',
      ),
    allowedTypes: z
      .array(
        z.enum(['local', 'virtual', 'remote', 'federated', 'distribution']),
      )
      .optional()
      .describe('LOCAL or VIRTUAL or REMOTE or DEFERATED or DISTRIBUTION'),
    allowedPackageTypes: z
      .array(
        z.enum([
          'bower',
          'cargo',
          'chef',
          'cocoapods',
          'composer',
          'conan',
          'cran',
          'debian',
          'docker',
          'gems',
          'gitlfs',
          'go',
          'gradle',
          'helm',
          'ivy',
          'maven',
          'nuget',
          'opkg',
          'p2',
          'pub',
          'puppet',
          'pypi',
          'rpm',
          'sbt',
          'swift',
          'terraform',
          'vagrant',
          'yum',
          'generic',
        ]),
      )
      .optional()
      .describe('Package manager type - [Generic, PyPi, Maven, NuGet, Go...]'),
  }),
);

/**
 * The input props that can be specified under `ui:options` for the
 * `RepositoryPicker` field extension.
 *
 * @public
 */
export type RepositoryPickerUiOptions =
  typeof RepositoryPickerFieldSchema.uiOptionsType;

export type RepositoryPickerProps = typeof RepositoryPickerFieldSchema.type;

export const ArtifactRepositoryPickerSchema: CustomFieldExtensionSchema =
  RepositoryPickerFieldSchema.schema;

export type RepositoryPickerFilterQuery = z.TypeOf<
  typeof entityQueryFilterExpressionSchema
>;

export type RepositoryPickerFilterQueryValue =
  RepositoryPickerFilterQuery[keyof RepositoryPickerFilterQuery];
