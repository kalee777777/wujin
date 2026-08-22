import { jsonResponse, errorResponse, successResponse } from '../utils.js';
import { signJWT, verifyAuth, hashPassword, comparePassword } from '../auth.js';

export async function login(request, env) {
  const { username, password } = await request.json();

  if (!username || !password) {
    return errorResponse('用户名和密码不能为空', 400);
  }

  const admin = await env.DB.prepare('SELECT * FROM admins WHERE username = ?')
    .bind(username)
    .first();

  if (!admin) {
    return errorResponse('用户名或密码错误', 401);
  }

  if (!comparePassword(password, admin.password)) {
    return errorResponse('用户名或密码错误', 401);
  }

  const token = await signJWT({ id: admin.id, username: admin.username, role: admin.role });

  return successResponse({
    token,
    admin: { id: admin.id, username: admin.username, role: admin.role },
  });
}

export async function me(request, env) {
  const auth = await verifyAuth(request);
  if (!auth.authorized) return errorResponse(auth.error, 401);

  const admin = await env.DB.prepare('SELECT id, username, role, created_at FROM admins WHERE id = ?')
    .bind(auth.admin.id)
    .first();

  if (!admin) return errorResponse('用户不存在', 404);

  return successResponse(admin);
}

export async function changePassword(request, env) {
  const auth = await verifyAuth(request);
  if (!auth.authorized) return errorResponse(auth.error, 401);

  const { oldPassword, newPassword } = await request.json();

  if (!oldPassword || !newPassword) {
    return errorResponse('旧密码和新密码不能为空', 400);
  }

  const admin = await env.DB.prepare('SELECT * FROM admins WHERE id = ?')
    .bind(auth.admin.id)
    .first();

  if (!admin) return errorResponse('用户不存在', 404);

  if (!comparePassword(oldPassword, admin.password)) {
    return errorResponse('旧密码错误', 400);
  }

  const hashedPassword = hashPassword(newPassword);
  await env.DB.prepare('UPDATE admins SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .bind(hashedPassword, auth.admin.id)
    .run();

  return successResponse(null, '密码修改成功');
}

export async function logout() {
  return successResponse(null, '已退出登录');
}
