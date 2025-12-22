import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';

import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';

import * as tf from '@tensorflow/tfjs';
// IMPORTANT: do NOT import from '@tensorflow/tfjs-react-native' root in Expo Go
import '@tensorflow/tfjs-react-native/dist/platform_react_native';
import { decodeJpeg } from '@tensorflow/tfjs-react-native/dist/decode_image';

export default function PredictScreen() {
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [prediction, setPrediction] = useState('');
  const [processing, setProcessing] = useState(false); // image conversion + predict

  useEffect(() => {
    const loadModel = async () => {
      try {
        await tf.setBackend('rn-webgl');
        await tf.ready();

        // Your patched model that loads correctly
        const modelUrl =
          'https://raw.githubusercontent.com/tanu1239/RP-project/main/model.json';

        const loadedModel = await tf.loadLayersModel(modelUrl);

        setModel(loadedModel);
        setLoading(false);
        Alert.alert('Success', 'Model Loaded!');
      } catch (error) {
        console.error(error);
        Alert.alert('Load Failed', String(error));
        setLoading(false);
      }
    };

    loadModel();
  }, []);

  // Convert ANY image to JPEG base64 so decodeJpeg always works
  const toJpegBase64 = async (uri) => {
    const manipulated = await ImageManipulator.manipulateAsync(
      uri,
      [],
      {
        compress: 1,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: true,
      }
    );

    if (!manipulated.base64) {
      // Extremely rare, but keep a fallback
      const b64 = await FileSystem.readAsStringAsync(manipulated.uri, {
        encoding: 'base64',
      });
      return { uri: manipulated.uri, base64: b64 };
    }

    return { uri: manipulated.uri, base64: manipulated.base64 };
  };

  const classifyImage = async ({ uri, base64 }) => {
    if (!model) return Alert.alert('Model not ready');

    try {
      setProcessing(true);

      // If base64 not provided, read from file
      const imgB64 =
        base64 ??
        (await FileSystem.readAsStringAsync(uri, {
          encoding: 'base64',
        }));

      const imgBuffer = tf.util.encodeString(imgB64, 'base64').buffer;
      const imgUint8 = new Uint8Array(imgBuffer);

      // decodeJpeg requires JPEG bytes (we ensure that via ImageManipulator)
      let imageTensor = decodeJpeg(imgUint8); // Tensor3D [H, W, 3]
      imageTensor = tf.image.resizeBilinear(imageTensor, [224, 224]);
      imageTensor = imageTensor.toFloat().div(255).expandDims(0);

      const out = model.predict(imageTensor);
      const preds = await out.data();

      imageTensor.dispose();
      out.dispose();

      // If softmax 2-class => preds length 2, else sigmoid => length 1
      const rpProb = preds.length === 2 ? preds[1] : preds[0];

      const label = rpProb > 0.5 ? 'RP Present' : 'No RP';
      const confidence = (rpProb > 0.5 ? rpProb : 1 - rpProb) * 100;

      const resultText = `${label}: ${confidence.toFixed(1)}%`;
      setPrediction(resultText);
      Alert.alert('Prediction', resultText);
    } catch (error) {
      Alert.alert('Error', String(error));
    } finally {
      setProcessing(false);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Camera permission required');

    const result = await ImagePicker.launchCameraAsync({
      quality: 1,
      allowsEditing: false,
    });

    if (!result.canceled) {
      try {
        setProcessing(true);
        const asset = result.assets[0];
        const jpeg = await toJpegBase64(asset.uri);
        await classifyImage({ uri: jpeg.uri, base64: jpeg.base64 });
      } catch (e) {
        Alert.alert('Error', String(e));
        setProcessing(false);
      }
    }
  };

  const pickGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Gallery permission required');

    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 1,
      allowsEditing: false,
    });

    if (!result.canceled) {
      try {
        setProcessing(true);
        const asset = result.assets[0];

        // Force-convert PNG/HEIC/WEBP/etc -> JPEG base64
        const jpeg = await toJpegBase64(asset.uri);

        await classifyImage({ uri: jpeg.uri, base64: jpeg.base64 });
      } catch (e) {
        Alert.alert('Error', String(e));
        setProcessing(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Retinitis Pigmentosa Detector</Text>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#14274e" />
          <Text style={styles.loadingText}>Loading Model...</Text>
        </View>
      ) : (
        <>
          <TouchableOpacity onPress={takePhoto} style={styles.button} disabled={processing}>
            <Text style={styles.buttonText}>
              {processing ? 'Processing...' : 'Take Photo'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={pickGallery} style={styles.button} disabled={processing}>
            <Text style={styles.buttonText}>
              {processing ? 'Processing...' : 'Upload from Gallery'}
            </Text>
          </TouchableOpacity>

          {prediction !== '' && (
            <Text style={styles.result}>{prediction}</Text>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#14274e',
  },
  loading: { alignItems: 'center' },
  loadingText: { marginTop: 20, fontSize: 16 },
  button: {
    backgroundColor: '#14274e',
    padding: 16,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
    marginVertical: 10,
    opacity: 1,
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  result: {
    marginTop: 40,
    fontSize: 28,
    fontWeight: 'bold',
    color: '#14274e',
  },
});
