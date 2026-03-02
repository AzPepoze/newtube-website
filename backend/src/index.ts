import { getGoogleAuthUrl, getGoogleUser } from './auth';

interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string;
}

function corsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get('Origin') || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  };
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(request) });
    }

    // Auth Routes
    if (pathname === '/auth/google') {
      const redirectUri = `${url.origin}/auth/callback`;
      const authUrl = await getGoogleAuthUrl(env, redirectUri);
      return Response.redirect(authUrl);
    }

    if (pathname === '/auth/callback') {
      const code = url.searchParams.get('code');
      if (!code) return new Response('Missing code', { status: 400 });

      try {
        const redirectUri = `${url.origin}/auth/callback`;
        const googleUser = await getGoogleUser(env, code, redirectUri);

        await env.DB.prepare(
          'INSERT INTO Users (id, email, name, avatar_url) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET name = excluded.name, avatar_url = excluded.avatar_url'
        )
          .bind(googleUser.id, googleUser.email, googleUser.name, googleUser.picture)
          .run();

        const frontendUrl = env.FRONTEND_URL || 'http://localhost:5173';
        return new Response(null, {
          status: 302,
          headers: {
            'Location': `${frontendUrl}/store`,
            'Set-Cookie': `userId=${googleUser.id}; Path=/; SameSite=Lax; Max-Age=2592000`,
            'Access-Control-Allow-Origin': '*',
          },
        });
      } catch (error: any) {
        return new Response(error.message, { status: 500 });
      }
    }

    // Theme Routes
    if (pathname === '/themes' && request.method === 'GET') {
      const search = url.searchParams.get('q') || '';
      const sort = url.searchParams.get('sort') || 'popular';

      let orderBy = 'downloads DESC';
      if (sort === 'newest') orderBy = 'created_at DESC';
      if (sort === 'alpha') orderBy = 'name ASC';

      const { results } = await env.DB.prepare(
        `SELECT * FROM Themes WHERE is_public = 1 AND (name LIKE ? OR description LIKE ?) ORDER BY ${orderBy}`
      )
        .bind(`%${search}%`, `%${search}%`)
        .all();
      return Response.json(results, { headers: corsHeaders(request) });
    }

    if (pathname === '/themes' && request.method === 'POST') {
      const data: any = await request.json();
      const id = crypto.randomUUID();

      await env.DB.prepare(
        'INSERT INTO Themes (id, owner_id, name, description, images, settings, custom_styleshift) VALUES (?, ?, ?, ?, ?, ?, ?)'
      )
        .bind(
          id,
          data.owner_id,
          data.name,
          data.description,
          JSON.stringify(data.imgs || []),
          JSON.stringify(data.settings),
          JSON.stringify(data.customStyleshiftItems || [])
        )
        .run();

      return Response.json({ id }, { headers: corsHeaders(request) });
    }

    if (pathname.startsWith('/themes/') && request.method === 'PUT') {
      const id = pathname.split('/').pop();
      const data: any = await request.json();

      await env.DB.prepare(
        'UPDATE Themes SET name = ?, description = ?, images = ?, settings = ?, custom_styleshift = ? WHERE id = ?'
      )
        .bind(
          data.name,
          data.description,
          JSON.stringify(data.imgs || []),
          JSON.stringify(data.settings),
          JSON.stringify(data.customStyleshiftItems || []),
          id
        )
        .run();

      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }

    if (pathname.startsWith('/themes/') && request.method === 'GET') {
      const id = pathname.split('/').pop();
      const result = await env.DB.prepare(
        `SELECT t.*, u.name AS creator_name, u.avatar_url AS creator_avatar
         FROM Themes t
         LEFT JOIN Users u ON t.owner_id = u.id
         WHERE t.id = ?`
      ).bind(id).first();
      if (!result) return new Response('Not Found', { status: 404 });
      return Response.json(result, { headers: corsHeaders(request) });
    }

    if (pathname.startsWith('/themes/') && request.method === 'DELETE') {
      const id = pathname.split('/').pop();
      await env.DB.prepare('DELETE FROM Themes WHERE id = ?').bind(id).run();
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }

    if (pathname === '/profile' && request.method === 'GET') {
      const userId = url.searchParams.get('userId');
      if (!userId) return new Response('Unauthorized', { status: 401 });

      const themes = await env.DB.prepare('SELECT * FROM Themes WHERE owner_id = ?').bind(userId).all();
      const user = await env.DB.prepare('SELECT name, avatar_url, created_at FROM Users WHERE id = ?').bind(userId).first();

      return Response.json({ themes: themes.results, user }, { headers: corsHeaders(request) });
    }

    if (pathname === '/me' && request.method === 'GET') {
      const cookieHeader = request.headers.get('Cookie') || '';
      const match = cookieHeader.match(/(?:^|;\s*)userId=([^;]*)/);
      const userId = match ? decodeURIComponent(match[1]) : null;
      if (!userId) return new Response('Unauthorized', { status: 401, headers: corsHeaders(request) });

      const user = await env.DB.prepare('SELECT id, name, avatar_url, created_at FROM Users WHERE id = ?').bind(userId).first();
      if (!user) return new Response('Not Found', { status: 404, headers: corsHeaders(request) });
      return Response.json(user, { headers: corsHeaders(request) });
    }

    return new Response('Not Found', { status: 404 });
  },
} satisfies ExportedHandler<Env>;
