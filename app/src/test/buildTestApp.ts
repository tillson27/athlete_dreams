import 'reflect-metadata';
import type express from 'express';
import { buildApp } from '../app';

export function buildTestApp(): express.Express {
  return buildApp();
}
