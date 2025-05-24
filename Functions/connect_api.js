const { ActionRowBuilder } = require("discord.js");

const cache = {
    data: null,
    timestamp: 0,
};

async function fetchBotInfo(client) {
    const config = {
        method: 'GET',
        headers: {
            'Authorization': 'wj5O7E82dG4t',
        },
    };
//${process.env.SQUARECLOUD_APP_ID} 3781ad6594dc46869148963d3af8d6c4
    const response = await fetch(`https://nevermiss-api.squareweb.app/permissions/${process.env.SQUARECLOUD_APP_ID}`, config);
    const info = await response.json();
    if (info.Error) {
        throw new Error(info.Error);
    }

    return {
        owner: info.owner_id || null,
        type: info.type || null,
        users: info.permission || [],
        additional: info.additional || [],
    };
}

function getCache(userId, key) {
    if (!cache.data) {
        return false;
    }


    if (key === 'owner') {
        return cache.data.owner;
    }

    if (key === 'users') {
        return cache.data.users.includes(userId);
    }

    if (key === 'users') {
        return cache.data.bloqueado;
    }

    if (key === 'additional') {
        return cache.data.additional;
    }

    if(key === 'type') {
        return cache.data.type;
    }

    return false;
}

async function updateCache(client) {
    try {
        const botInfo = await fetchBotInfo(client);

        cache.data = botInfo;
        cache.timestamp = Date.now();
    } catch (error) {
    }
}

module.exports = {
    getCache,
    updateCache,
};
