import { NextRequest } from 'next/server';

export function isAdminRequest(request: NextRequest): boolean {
  const configuredPassword = process.env.ADMIN_PASSWORD;
  const suppliedPassword = request.headers.get('x-admin-password');

  return Boolean(
    configuredPassword &&
      suppliedPassword &&
      suppliedPassword === configuredPassword
  );
}
