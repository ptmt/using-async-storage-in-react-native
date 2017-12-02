import { AsyncStorage } from 'react-native';

export async function setItem(key, array, chunksNumber = 20) {
  const totalItems = array.length;
  const chunkLength = totalItems / chunksNumber;
  const arraysPromises = Array.apply(null, Array(chunksNumber)).map(
    async (_, i) => {
      const j = chunkLength * i;
      const serialized = JSON.stringify(array.slice(j, j + chunkLength));
      await AsyncStorage.setItem(key + i, serialized);
    }
  );
  await Promise.all(arraysPromises);
}

export async function getItem(key, chunksNumber = 20) {
  const arraysPromises = Array.apply(null, Array(chunksNumber)).map(
    async (_, i) => {
      const serialized = await AsyncStorage.getItem(key + i);
      return JSON.parse(serialized);
    }
  );
  const arrays = await Promise.all(arraysPromises);
  return arrays.reduce((a, b) => a.concat(b), []);
}
