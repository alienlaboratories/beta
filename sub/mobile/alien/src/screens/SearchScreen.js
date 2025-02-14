//
// Copyright 2017 Alien Labs.
//

import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';

/**
 *
 */
export default class SearchScreen extends React.Component {
  static navigationOptions = {
    title: 'Search',
  };

  render() {
    return (
      <ScrollView style={styles.container}>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 15,
    backgroundColor: '#fff',
  },
});
