const IP_ADDRESS = import.meta.env.VITE_COLLAB_IP || 'localhost';
const PORT = import.meta.env.VITE_COLLAB_PORT || '5000';

export const COLLAB_URL = `${IP_ADDRESS}:${PORT}`;