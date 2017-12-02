/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  Platform,
  Button,
  AsyncStorage,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const RNFS = require('react-native-fs');

import { setItem, getItem } from './AsyncStorageArrayWrapper';

const path = RNFS.DocumentDirectoryPath + '/report.json';
const N = 25;
let running = false;

export default class App extends Component<{}> {
  state = {
    path: '',
    progress: '',
  };
  render() {
    return (
      <View style={styles.container}>
        <Button
          title="Run single test"
          onPress={() =>
            runSingleTest(this.setState.bind(this)).then(path =>
              this.setState({ path })
            )
          }
        />
        <View style={{ height: 100 }} />
        <Button
          title="Run tests"
          onPress={() =>
            runTests(this.setState.bind(this)).then(path =>
              this.setState({ path })
            )
          }
        />
        <Text>{this.state.progress}</Text>
        <Text>{this.state.path}</Text>
      </View>
    );
  }
}

function delay(duration) {
  return new Promise(resolve => {
    setTimeout(() => resolve(), duration);
  });
}

async function runSingleTest(setState) {
  try {
    const result = await measureRead(3100);
    setState({ progress: JSON.stringify(result) });
  } catch (e) {
    console.error(e);
  }
}

async function runTests(setState) {
  if (running) {
    return;
  }
  running = true;
  setState({ progress: 'started' });
  try {
    const amounts = Array.apply(null, Array(N)).map((_, i) => i * 1000 + 100);

    // run them sequentally
    const writes = [];
    for (const [index, amount] of amounts.entries()) {
      const result = await measureWrites(amount);
      writes.push(result);
      console.log('write', result);
      setState({
        progress: `writes: ${Math.round(index * 100 / amounts.length)}%`,
      });
    }
    const reads = [];
    for (const [index, amount] of amounts.entries()) {
      const result = await measureRead(amount);
      console.log('read', result);
      reads.push(result);
      setState({
        progress: `reads: ${Math.round(index * 100 / amounts.length)}%`,
      });
    }

    const queries = [];
    for (const [index, amount] of amounts.entries()) {
      const result = await measureQueries(amount);
      queries.push(result);
      setState({
        progress: `queries: ${Math.round(index * 100 / amounts.length)}%`,
      });
    }

    const report = {
      writes,
      reads,
      queries,
    };

    await RNFS.writeFile(path, JSON.stringify(report), 'utf8');
    running = false;
    return path;
  } catch (e) {
    console.error(e);
    running = false;
    return 'Error';
  }
}

async function measureWrites(amount: number) {
  const records = Array.apply(null, Array(amount)).map(createARecord);
  const startTime = new Date();
  const serialized = JSON.stringify(records);
  await setItem('key', records);
  const elapsed = new Date() - startTime;
  const size = serialized.length / 1024 / 1024;

  return {
    amount,
    size,
    elapsed,
    speed: size / elapsed,
  };
}

async function measureRead(amount: number) {
  const records = Array.apply(null, Array(amount)).map(createARecord);
  const serialized = JSON.stringify(records);
  const size = serialized.length / 1024 / 1024;
  await setItem('key', records);
  console.log('size=', size);
  const startTime = new Date();
  try {
    const loadedRecords = await getItem('key');
    const elapsed = new Date() - startTime;

    return {
      amount,
      size,
      elapsed,
      speed: size / elapsed,
    };
  } catch (e) {
    console.log(e);
    return { amount, size, elapsed: 0, speed: 0 };
  }
}

async function measureQueries(amount: number) {
  await delay(100);
  const records = Array.apply(null, Array(amount)).map(createARecord);
  const serialized = JSON.stringify(records);
  const startTime = new Date();
  const queryResult = records
    .sort((a, b) => b.randomDateField.getTime() - a.randomDateField.getTime())
    .filter(
      a =>
        a.randomBooleanFlag1 &&
        !a.randomBooleanFlag2 &&
        a.randomTextField1[0] === '6'
    );
  console.log(queryResult.length);
  const elapsed = new Date() - startTime;
  const size = serialized.length / 1024 / 1024;
  return {
    amount,
    size,
    elapsed,
    speed: size / elapsed,
  };
}

function makeString(length: number) {
  var text = '';
  var possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

function createARecord() {
  return {
    randomNumberKey: new Date().getTime(),
    randomTextField1: makeString(100),
    randomTextField2: makeString(200),
    randomBooleanFlag1: Math.random() > 0.5,
    randomBooleanFlag2: Math.random() > 0.5,
    randomObjectField: {
      randomKey: new Date().getTime(),
      randomTextField1: makeString(100),
      randomTextField2: makeString(200),
      randomDateField: new Date(),
    },
    randomDateField: new Date(),
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
});
