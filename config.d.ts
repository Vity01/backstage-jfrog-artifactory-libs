export interface Config {
  jfrog: {
    artifactory: {
      /**
       * URL to artifactory instance
       * Example: https://artifactory.my-company.com/
       * @visibility frontend
       */
      url: string;
      /**
       * Path to the backend proxy linking JFrog Artifactory
       * Default value is '/artifactory-proxy/'.
       * @visibility frontend
       */
      proxyPath: string;
    };
  };
}
