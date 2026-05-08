const api = {
    _token: () => localStorage.getItem('gate_token'),

    async _request(method, path, body = null) {
        const opts = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        };
        const token = this._token();
        if (token) opts.headers['Authorization'] = `Bearer ${token}`;
        if (body)  opts.body = JSON.stringify(body);

        let res;
        try {
            res = await fetch(API_BASE + path, opts);
        } catch (e) {
            throw { network: true, message: 'No internet connection. Check your network.' };
        }

        // Only redirect to login on 401 when a token exists (session expired).
        // A 401 on /login itself just means wrong password — let it through.
        if (res.status === 401 && token) {
            localStorage.removeItem('gate_token');
            localStorage.removeItem('gate_user');
            toast.show('Session expired. Please sign in again.', 'warning');
            app.render('login');
            throw { auth: true };
        }

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            throw { message: data.message || `Server error (${res.status})`, status: res.status };
        }

        return data;
    },

    get:  (path)       => api._request('GET',  path),
    post: (path, body) => api._request('POST', path, body),
};
