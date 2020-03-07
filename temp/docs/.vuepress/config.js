module.exports = {
    themeConfig: {
        logo: '/logo.png',
        nav: [
            { text: 'NixOS', link: '/nixos-manual/' },
            { text: 'Nix', link: '/nix-manual/' },
            { text: 'Nixpkgs', link: '/nixpkgs-manual' },
            { text: 'NixOps', link: '/nixops-manual/' },
        ]
        displayAllHeaders: true,
        lastUpdated: 'Last Updated',
    }
    base: '/nix-zh/',
    head: [
        ['link', { rel: 'icon', href: '/logo.png' }]
    ]
}