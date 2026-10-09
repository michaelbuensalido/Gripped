import React, { useEffect } from 'react';
import { Redirect, useRouter } from 'expo-router';

export default function SignupScreen() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/onboarding');
  }, [router]);

  return <Redirect href="/onboarding" />;
}
