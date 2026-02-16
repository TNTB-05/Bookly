import { authApi } from '../modules/auth/auth';

export const timeBlocksService = {
    // Get expanded time blocks for a date range (for calendar view)
    getTimeBlocks: async (startDate, endDate) => {
        const response = await authApi.get(`/api/provider/time-blocks?startDate=${startDate}&endDate=${endDate}`);
        return response.json();
    },

    // Get raw (non-expanded) time blocks for management view
    getRawTimeBlocks: async () => {
        const response = await authApi.get('/api/provider/time-blocks/raw');
        return response.json();
    },

    // Create a new time block
    createTimeBlock: async (blockData) => {
        const response = await authApi.post('/api/provider/time-blocks', blockData);
        return response.json();
    },

    // Update an existing time block
    updateTimeBlock: async (blockId, updateData) => {
        const response = await authApi.put(`/api/provider/time-blocks/${blockId}`, updateData);
        return response.json();
    },

    // Delete a time block
    deleteTimeBlock: async (blockId, targetInstance = 'all', instanceDate = null) => {
        let url = `/api/provider/time-blocks/${blockId}?targetInstance=${targetInstance}`;
        if (instanceDate) url += `&instanceDate=${instanceDate}`;
        const response = await authApi.delete(url);
        return response.json();
    }
};
