import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { httpLogger } from './http.logger';
import * as dayjs from 'dayjs';

type TExceptionResponse = {
  message: string;
  statusCode: number;
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = '未知错误';

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse() as TExceptionResponse;
      message = exceptionResponse.message;
    } else {
      const logMessage = {
        statusCode: status,
        method: request.method,
        originalUrl: request.originalUrl,
        cost: 0,
        contentType: request.headers['content-type'],
        reqBody: request.body,
        resBody: exception.stack,
        errStack: true,
      };
      httpLogger.error(logMessage);
    }

    response.status(status).json({
      code: status,
      message,
      timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      path: `${request.method} ${request.originalUrl}`,
    });
  }
}
