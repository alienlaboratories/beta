//
// Copyright 2017 Alien Labs.
//

import { Platform } from 'react-native';

/**
 *
 */
export class IconUtil {

  // Icons: https://infinitered.github.io/ionicons-version-3-search

  static getIcon(ios, android, focused=false) {
    return Platform.OS === 'ios' ? `${ios}${focused ? '' : '-outline'}` : android;
  }
}
