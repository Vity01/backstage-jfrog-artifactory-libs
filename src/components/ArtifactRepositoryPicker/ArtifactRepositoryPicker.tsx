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
import { Entity } from '@backstage/catalog-model';
import { TextField } from '@material-ui/core';
import FormControl from '@material-ui/core/FormControl';
import Autocomplete, {
  AutocompleteChangeReason,
} from '@material-ui/lab/Autocomplete';
import React, { useCallback, useEffect } from 'react';
import useAsync from 'react-use/lib/useAsync';
import { RepositoryPickerProps, RepositoryPickerUiOptions } from './schema';
import { configApiRef, useApi } from '@backstage/core-plugin-api';
import { DEFAULT_PROXY_PATH } from '../LibArtifactCard';
import {getErrorMessage} from "../LibArtifactCard/api";

export { ArtifactRepositoryPickerSchema } from './schema';

/**
 * The underlying component that is rendered in the form for the `RepositoryPicker`
 * field extension.
 *
 * @public
 */
export const ArtifactRepositoryPicker = (props: RepositoryPickerProps) => {
  const {
    onChange,
    schema: { title = 'Artifact repository', description = 'Repository key' },
    required,
    uiSchema,
    rawErrors,
    formData,
    idSchema,
  } = props;

  const repositoriesFilter = buildRepositoryFilterSettings(uiSchema);

  const config = useApi(configApiRef);

  const artifactoryBackendProxy =
    config.getOptionalString('jfrog.artifactory.proxyPath') ||
    DEFAULT_PROXY_PATH;

  const { value: entities, loading } = useAsync(async () => {
    const backendUrl = config.getString('backend.baseUrl');
    const proxyUrl = `/proxy${artifactoryBackendProxy}`;

    // unfortunately filtering does not support multiple values :-(. Damn it JFrog!
    const url = `${backendUrl}/api${proxyUrl}artifactory/api/repositories`;

    const response = await fetch(url);
    if (response.status !== 200) {
      throw new Error(
        `Cannot get repositories list - ` + (await getErrorMessage(response)),
      );
    }

    const reposResponse: RepositoryInfo[] = await response.json();
    return reposResponse
      .filter(
        item =>
          repositoriesFilter.packageTypes === undefined ||
          repositoriesFilter.packageTypes.length === 0 ||
          repositoriesFilter.packageTypes.includes(
            item.packageType.toLowerCase(),
          ),
      )
      .filter(
        item =>
          repositoriesFilter.repositoryTypes === undefined ||
          repositoriesFilter.repositoryTypes.length === 0 ||
          repositoriesFilter.repositoryTypes.includes(item.type.toLowerCase()),
      )
      .filter(
        item =>
          repositoriesFilter.excludedRegex === undefined ||
          repositoriesFilter.excludedRegex.length === 0 ||
          !repositoriesFilter.excludedRegex.find(itemRegex =>
            itemRegex.test(item.key),
          ),
      )
      .map(item => item.key);
  });

  const allowArbitraryValues =
    uiSchema['ui:options']?.allowArbitraryValues || true;

  const getLabel = useCallback((ref: string) => {
    return ref;
  }, []);

  const onSelect = useCallback(
    (_: any, ref: string | Entity | null, reason: AutocompleteChangeReason) => {
      // ref can either be a string from free solo entry or
      if (typeof ref !== 'string') {
        // if ref does not exist: pass 'undefined' to trigger validation for required value
        // onChange(ref ? stringifyEntityRef(ref as Entity) : undefined);
        onChange(ref ? 'unknown object' : undefined);
      } else {
        if (reason === 'blur' || reason === 'create-option') {
          // Add in default namespace, etc.
          // We need to check against formData here as that's the previous value for this field.
          if (formData !== ref || allowArbitraryValues) {
            onChange(ref);
          }
        }
      }
    },
    [onChange, formData, allowArbitraryValues],
  );

  useEffect(() => {
    if (entities?.length === 1) {
      onChange(entities[0]);
    }
  }, [entities, onChange]);

  return (
    <FormControl
      margin="normal"
      required={required}
      error={rawErrors?.length > 0 && !formData}
    >
      <Autocomplete
        disabled={entities?.length === 1}
        id={idSchema?.$id}
        value={
          // Since free solo can be enabled, attempt to parse as a full entity ref first, then fall
          //  back to the given value.
          entities?.find(e => e === formData) ??
          (allowArbitraryValues && formData ? getLabel(formData) : '')
        }
        loading={loading}
        onChange={onSelect}
        options={entities || []}
        getOptionLabel={option =>
          // option can be a string due to freeSolo.
          typeof option === 'string' ? option : JSON.stringify(option)
        }
        autoSelect
        freeSolo={Boolean(allowArbitraryValues)}
        renderInput={params => (
          <TextField
            {...params}
            label={title}
            margin="dense"
            helperText={description}
            FormHelperTextProps={{ margin: 'dense', style: { marginLeft: 0 } }}
            variant="outlined"
            required={required}
            InputProps={params.InputProps}
          />
        )}
      />
    </FormControl>
  );
};

type RepositoryFilterSettings = {
  repositoryTypes: string[] | undefined;
  packageTypes: string[] | undefined;
  excludedRegex: RegExp[] | undefined;
};

function createRegExpFromString(pattern: string): RegExp | undefined {
  // Extract the pattern and flags from the input string
  const regexPattern = pattern.match(/^\/(.*?)\/([gimyus]*)$/);

  if (regexPattern && regexPattern.length >= 2) {
    const [, patternPart, flagsPart] = regexPattern;

    try {
      // Create a new RegExp instance with the extracted pattern and flags
      return new RegExp(patternPart, flagsPart);
    } catch (error) {
      console.error('Error creating RegExp:', error);
      return undefined;
    }
  } else {
    console.error('Invalid regex pattern format');
    return undefined;
  }
}

function buildRepositoryFilterSettings(
  uiSchema: RepositoryPickerProps['uiSchema'],
): RepositoryFilterSettings {
  const allowedTypes: RepositoryPickerUiOptions['allowedTypes'] | undefined =
    uiSchema['ui:options']?.allowedTypes;

  const allowedPackageTypes:
    | RepositoryPickerUiOptions['allowedPackageTypes']
    | undefined = uiSchema['ui:options']?.allowedPackageTypes;

  // Extract the pattern and flags from the regex string

  const excludedRegex = uiSchema['ui:options']?.excludedRegex
    ?.map(regexString => createRegExpFromString(regexString))
    .filter(item => item !== undefined)
    .map(regex => regex as RegExp);

  return {
    repositoryTypes: allowedTypes?.map(item => item.toLowerCase()),
    packageTypes: allowedPackageTypes?.map(item => item.toLowerCase()),
    excludedRegex: excludedRegex,
  };
}

interface RepositoryInfo {
  key: string;
  description: string;
  type: string;
  packageType: string;
}
