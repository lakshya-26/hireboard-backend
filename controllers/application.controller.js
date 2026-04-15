import * as applicationService from '../services/application.service.js';
import { sendResponse } from '../middlewares/reqRes.middleware.js';
import { commonErrorHandler } from '../utils/errorHandler.js';

export async function create(req, res) {
  try {
    const data = await applicationService.createApplication(req.userId, req.body);
    req.statusCode = 201;
    req.data = data;
    req.message = 'Application created successfully';
    return sendResponse(req, res);
  } catch (error) {
    return commonErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

export async function list(req, res) {
  try {
    const data = await applicationService.getApplications(req.userId, req.query);
    req.statusCode = 200;
    req.data = data;
    req.message = 'Applications fetched successfully';
    return sendResponse(req, res);
  } catch (error) {
    return commonErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

export async function getOne(req, res) {
  try {
    const data = await applicationService.getApplicationById(req.userId, req.params.id);
    req.statusCode = 200;
    req.data = data;
    req.message = 'Application fetched successfully';
    return sendResponse(req, res);
  } catch (error) {
    return commonErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

export async function update(req, res) {
  try {
    const data = await applicationService.updateApplication(
      req.userId,
      req.params.id,
      req.body,
    );
    req.statusCode = 200;
    req.data = data;
    req.message = 'Application updated successfully';
    return sendResponse(req, res);
  } catch (error) {
    return commonErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

export async function remove(req, res) {
  try {
    const data = await applicationService.deleteApplication(req.userId, req.params.id);
    req.statusCode = 200;
    req.data = data;
    req.message = 'Application deleted successfully';
    return sendResponse(req, res);
  } catch (error) {
    return commonErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

export async function addNote(req, res) {
  try {
    const data = await applicationService.addNoteToApplication(
      req.userId,
      req.params.id,
      req.body,
    );
    req.statusCode = 200;
    req.data = data;
    req.message = 'Note added successfully';
    return sendResponse(req, res);
  } catch (error) {
    return commonErrorHandler(req, res, error.message, error.statusCode, error);
  }
}
