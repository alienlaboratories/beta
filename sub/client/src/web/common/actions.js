//
// Copyright 2017 Minder Labs.
//

export class Actions {

  static Debug = [
    {
      type: 'bug',
      title: 'Debug info.',
      icon: 'bug_report',
      handler: (action) => { console.log(action); }
    },
    {
      type: 'link',
      title: 'GraphiQL.',
      icon: 'language',
      href: '/graphiql',
      handler: (action) => { console.log(action); }
    },
    {
      type: 'link',
      title: 'Admin console.',
      icon: 'graphic_eq',
      href: '/admin',
      handler: (action) => { console.log(action); }
    },
    {
      type: 'link',
      title: 'Account settings.',
      icon: 'settings',
      href: '/profile',
      handler: (action) => { console.log(action); }
    }
  ];

  static Runtime = [
    {
      type: 'refresh',
      title: 'Refresh queries.',
      icon: 'refresh',
      handler: (action) => { console.log(action); }
    }
  ];

  static actions() {
    return {
      debug: Actions.Debug,
      runtime: Actions.Runtime
    };
  }
}
