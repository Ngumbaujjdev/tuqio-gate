const auth = {
    async login(email, password) {
        const data = await api.post('/login', { email, password });
        if (data.token) {
            localStorage.setItem('gate_token', data.token);
            localStorage.setItem('gate_user', JSON.stringify(data.user));
            return { ok: true };
        }
        return { ok: false, message: data.message || 'Login failed.' };
    },

    logout() {
        api.post('/logout').catch(() => {});
        localStorage.removeItem('gate_token');
        localStorage.removeItem('gate_user');
    },

    isLoggedIn: () => !!localStorage.getItem('gate_token'),
    getUser:    () => JSON.parse(localStorage.getItem('gate_user') || 'null'),
};
