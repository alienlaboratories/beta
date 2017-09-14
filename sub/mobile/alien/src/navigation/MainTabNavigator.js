//
// Copyright 2017 Alien Labs.
//

import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { TabNavigator, TabBarBottom } from 'react-navigation';

import Colors from '../constants/Colors';

import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import SettingsScreen from '../screens/SettingsScreen';

import { IconUtil } from '../util/icon';

/**
 *
 */
export default TabNavigator(
  {
    Home: {
      screen: HomeScreen,
    },
    Search: {
      screen: SearchScreen,
    },
    Settings: {
      screen: SettingsScreen,
    },
  },
  {
    navigationOptions: ({ navigation }) => ({
      tabBarIcon: ({ focused }) => {
        let iconName;

        const { routeName } = navigation.state;
        switch (routeName) {

          case 'Home':
            iconName = IconUtil.getIcon('ios-home', 'md-home', focused);
            break;

          case 'Search':
            iconName = IconUtil.getIcon('ios-search', 'md-search', focused);
            break;

          case 'Settings':
            iconName = IconUtil.getIcon('ios-options', 'md-options', focused);
        }

        return (
          <Ionicons
            name={iconName}
            size={28}
            style={{ marginBottom: -3 }}
            color={focused ? Colors.tabIconSelected : Colors.tabIconDefault}
          />
        );
      },
    }),
    tabBarComponent: TabBarBottom,
    tabBarPosition: 'bottom',
    animationEnabled: false,
    swipeEnabled: false,
  }
);
