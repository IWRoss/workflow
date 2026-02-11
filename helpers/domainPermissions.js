const getPermissionsByDomain = (domain) =>{

    // Define permissions for each allowed domain
    const domainPermissions = {
        "cegos.uk": {
            routes: ["/dashboard", "/sequoia-dashboard", ],
            features: [ "sequoia-dashboard"],
        },
        'cegos.us': {
            routes: ['/dashboard', '/sequoia-dashboard'],
            features: ['sequoia-dashboard']
        },
        'sequoia.com': {
            routes: ['/dashboard', '/sequoia-dashboard'],
            features: ['sequoia-dashboard']
        },
    };

    // Return permissions for the given domain or default permissions
    return domainPermissions[domain] || { routes: ['/dashboard'], features: [] };

}

module.exports = { getPermissionsByDomain };
