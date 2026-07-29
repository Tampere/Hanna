import axios from 'axios';
import path from 'path';
import { BasicAuthSecurity, Client, createClientAsync } from 'soap';

import { logger } from '@backend/logging.js';

/**
 * `BasicAuthSecurity#toXML` returns an empty string, so since `soap` v1.10 the client
 * skips emitting a `<soap:Header>` element altogether when it's the only configured
 * security mechanism. SAP's endpoint (and the local mock) require the Header element
 * to be present even if empty, so force its emission via a no-op `postProcess`.
 */
class BasicAuthSecurityWithHeader extends BasicAuthSecurity {
  postProcess(xml: string) {
    return xml;
  }
}

interface WebServiceConfig {
  endpoint: string;
  basicAuthUser: string;
  basicAuthPass: string;
  wsdlResourcePath: string;
}

class WebService {
  protected client: Client | null = null;

  private async createClient(config: WebServiceConfig) {
    logger.info('Initializing SAP Web Service client...');
    logger.info(`SAP endpoint: ${config.endpoint}`);

    const axiosClient = axios.create({
      transformRequest: [],
    });

    axiosClient.interceptors.request.use((request) => {
      logger.trace({
        requestData: request.data,
        requestPath: request.url,
        requestMethod: request.method,
      });
      return request;
    });

    axiosClient.interceptors.response.use((response) => {
      logger.trace({ responseData: response.data, responseStatus: response.status });
      return response;
    });

    this.client = await createClientAsync(path.join(process.cwd(), config.wsdlResourcePath), {
      request: axiosClient as any, // Some type discrepancies between axios imported as a module and axios used by soap here,
    });

    this.client.setSecurity(
      new BasicAuthSecurityWithHeader(config.basicAuthUser, config.basicAuthPass),
    );
    this.client.setEndpoint(config.endpoint);
    logger.info('SAP Web Service client initialized');
  }

  protected constructor(config: WebServiceConfig) {
    this.createClient(config);
  }

  protected getClient() {
    if (!this.client) {
      throw Error('WebService client is not initialized');
    } else {
      return this.client;
    }
  }
}

export class ProjectInfoService extends WebService {
  private static instance: ProjectInfoService | null = null;

  private constructor(config: WebServiceConfig) {
    super(config);
  }

  public static initialize(config: WebServiceConfig) {
    if (!this.instance) {
      this.instance = new ProjectInfoService(config);
    }
  }

  public static getClient() {
    if (!this.instance) {
      throw Error('ProjectInfoService is not initialized');
    }
    return this.instance.getClient();
  }
}

export class ActualsService extends WebService {
  private static instance: ActualsService | null = null;

  private constructor(config: WebServiceConfig) {
    super(config);
  }

  public static initialize(config: WebServiceConfig) {
    if (!this.instance) {
      this.instance = new ActualsService(config);
    }
  }

  public static getClient() {
    if (!this.instance) {
      throw Error('ActualsService is not initialized');
    }
    return this.instance.getClient();
  }
}
