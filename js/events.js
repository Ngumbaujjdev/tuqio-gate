const eventsModule = {
    async fetchEvents() {
        return api.get('/events');
    },

    async fetchEventDetail(eventId) {
        return api.get(`/events/${eventId}`);
    },
};
