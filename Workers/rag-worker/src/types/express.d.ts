// rag-worker/src/types/express.d.ts
declare module 'express' {
  import * as core from 'express-serve-static-core';
  
  export interface Request extends core.Request {}
  export interface Response extends core.Response {}
  export interface Application extends core.Application {}
  export interface RequestHandler extends core.RequestHandler {}
  
  function e(): Application;
  export default e;
}

declare module 'express-serve-static-core' {
  export interface Request {
    body?: any;
    query?: any;
    params?: any;
  }
  
  export interface Response {
    status(code: number): this;
    json(body: any): this;
    send(body?: any): this;
  }
  
  export interface Application {
    get(path: string, ...handlers: RequestHandler[]): this;
    post(path: string, ...handlers: RequestHandler[]): this;
    put(path: string, ...handlers: RequestHandler[]): this;
    delete(path: string, ...handlers: RequestHandler[]): this;
    listen(port: number | string, callback?: () => void): any;
    use(...handlers: any[]): this;
  }
  
  export interface RequestHandler {
    (req: Request, res: Response, next?: any): void | Promise<void>;
  }
}