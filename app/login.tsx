import React, { useEffect } from 'react';
import { Redirect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
  const router = useRouter();

  useEffect(() => {
    AsyncStorage.setItem('@cruxlog/onboarded', 'true').then(() => {
      router.replace('/');
    });
  }, [router]);

  return <Redirect href="/" />;
}
