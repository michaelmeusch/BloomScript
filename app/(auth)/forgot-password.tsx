import { useSignIn } from '@clerk/expo';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppLogo from '../../components/AppLogo';

const COLORS = {
  background: '#F8F4EE',
  primary: '#2D4A3E',
  accent: '#C4913A',
  foreground: '#1A1A1A',
  muted: '#8A7E74',
  border: '#E5DDD3',
  card: '#FFFFFF',
  error: '#DC2626',
};

// Three stages of the password-reset flow
type Stage = 'request' | 'verify' | 'reset';

export default function ForgotPasswordScreen() {
  // Core v3 API: { signIn, errors, fetchStatus } — no isLoaded / setActive
  const { signIn, errors, fetchStatus } = useSignIn();
  const insets = useSafeAreaInsets();

  const [stage, setStage]               = useState<Stage>('request');
  const [email, setEmail]               = useState('');
  const [code, setCode]                 = useState('');
  const [newPassword, setNewPassword]   = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isLoading = fetchStatus === 'fetching';

  // ── Step 1: Identify user and send reset code ────────────────────────────
  const handleRequestReset = async () => {
    if (!email.trim()) return;
    setErrorMessage(null);

    // Identify the user (no strategy — v3 separates identify from send)
    const { error: createError } = await signIn.create({
      identifier: email.trim().toLowerCase(),
    });

    if (createError) {
      setErrorMessage(
        errors.fields.identifier?.message ??
        createError.message ??
        'Could not send reset code. Check your email address.',
      );
      return;
    }

    // Send the reset code via email
    const { error: sendError } = await signIn.resetPasswordEmailCode.sendCode();

    if (sendError) {
      setErrorMessage(sendError.message ?? 'Failed to send reset code. Please try again.');
      return;
    }

    setStage('verify');
  };

  // ── Step 2: Verify the code ───────────────────────────────────────────────
  const handleVerifyCode = async () => {
    if (!code.trim()) return;
    setErrorMessage(null);

    const { error } = await signIn.resetPasswordEmailCode.verifyCode({ code: code.trim() });

    if (error) {
      setErrorMessage(
        errors.fields.code?.message ??
        error.message ??
        'Invalid code. Please try again.',
      );
      return;
    }

    // After successful verification, status becomes 'needs_new_password'
    if (signIn.status === 'needs_new_password') {
      setStage('reset');
    } else {
      setErrorMessage('Verification incomplete. Please try again.');
    }
  };

  // ── Step 3: Submit new password ───────────────────────────────────────────
  const handleSubmitPassword = async () => {
    if (!newPassword) return;
    setErrorMessage(null);

    const { error } = await signIn.resetPasswordEmailCode.submitPassword({
      password: newPassword,
      signOutOfOtherSessions: true,
    });

    if (error) {
      setErrorMessage(
        errors.fields.password?.message ??
        error.message ??
        'Password too weak or invalid. Please try again.',
      );
      return;
    }

    // Status is now 'complete' — finalize to activate the session
    if (signIn.status === 'complete') {
      await signIn.finalize({
        navigate: ({ session }) => {
          if (session?.currentTask) return;
          router.replace('/(tabs)' as any);
        },
      });
    }
  };

  // ── Stage: Reset (new password) ───────────────────────────────────────────
  if (stage === 'reset') {
    return (
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={[styles.container, { paddingTop: insets.top + 24 }]}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setStage('verify')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="arrow-left" size={20} color={COLORS.primary} />
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>

          <View style={styles.logoRow}>
            <AppLogo size={80} />
          </View>

          <Text style={styles.title}>Set new password</Text>
          <Text style={styles.subtitle}>
            Choose a strong new password for your account.
          </Text>

          <View style={styles.form}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>New password</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  value={newPassword}
                  onChangeText={(v) => { setNewPassword(v); setErrorMessage(null); }}
                  secureTextEntry={!showPassword}
                  placeholder="Choose a strong password"
                  placeholderTextColor={COLORS.muted}
                  returnKeyType="done"
                  onSubmitEditing={handleSubmitPassword}
                  autoFocus
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword((v) => !v)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color={COLORS.muted} />
                </TouchableOpacity>
              </View>
              {errors.fields.password && (
                <Text style={styles.fieldError}>{errors.fields.password.message}</Text>
              )}
            </View>

            {errorMessage ? (
              <View style={styles.errorRow}>
                <Feather name="alert-circle" size={14} color={COLORS.error} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            <Pressable
              style={[styles.primaryBtn, (!newPassword || isLoading) && styles.primaryBtnDisabled]}
              onPress={handleSubmitPassword}
              disabled={!newPassword || isLoading}
            >
              {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Reset Password</Text>}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ── Stage: Verify (code entry) ────────────────────────────────────────────
  if (stage === 'verify') {
    return (
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={[styles.container, { paddingTop: insets.top + 24 }]}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setStage('request')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="arrow-left" size={20} color={COLORS.primary} />
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>

          <View style={styles.logoRow}>
            <AppLogo size={80} />
          </View>

          <Text style={styles.title}>Check your email</Text>
          <Text style={styles.subtitle}>
            Enter the code we sent to{'\n'}
            <Text style={{ color: COLORS.primary, fontFamily: 'Inter_600SemiBold' }}>{email}</Text>
          </Text>

          <View style={styles.form}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Reset code</Text>
              <TextInput
                style={[styles.input, styles.codeInput]}
                value={code}
                onChangeText={(v) => { setCode(v); setErrorMessage(null); }}
                keyboardType="number-pad"
                placeholder="000000"
                placeholderTextColor={COLORS.muted}
                maxLength={6}
                returnKeyType="done"
                onSubmitEditing={handleVerifyCode}
                autoFocus
              />
              {errors.fields.code && (
                <Text style={styles.fieldError}>{errors.fields.code.message}</Text>
              )}
            </View>

            {errorMessage ? (
              <View style={styles.errorRow}>
                <Feather name="alert-circle" size={14} color={COLORS.error} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            <Pressable
              style={[styles.primaryBtn, (!code || isLoading) && styles.primaryBtnDisabled]}
              onPress={handleVerifyCode}
              disabled={!code || isLoading}
            >
              {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Verify Code</Text>}
            </Pressable>

            <TouchableOpacity
              style={styles.ghostBtn}
              onPress={async () => {
                try { await signIn.resetPasswordEmailCode.sendCode(); } catch {}
              }}
              disabled={isLoading}
            >
              <Text style={styles.ghostBtnText}>Resend code</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ── Stage: Request (email entry) ──────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={[styles.container, { paddingTop: insets.top + 24 }]}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="arrow-left" size={20} color={COLORS.primary} />
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.logoRow}>
          <AppLogo size={80} />
        </View>

        <Text style={styles.title}>Forgot password?</Text>
        <Text style={styles.subtitle}>
          Enter your email and we'll send you a code to reset your password.
        </Text>

        <View style={styles.form}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={(v) => { setEmail(v); setErrorMessage(null); }}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder="you@example.com"
              placeholderTextColor={COLORS.muted}
              returnKeyType="done"
              onSubmitEditing={handleRequestReset}
              autoFocus
            />
            {errors.fields.identifier && (
              <Text style={styles.fieldError}>{errors.fields.identifier.message}</Text>
            )}
          </View>

          {errorMessage ? (
            <View style={styles.errorRow}>
              <Feather name="alert-circle" size={14} color={COLORS.error} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          <Pressable
            style={[styles.primaryBtn, (!email || isLoading) && styles.primaryBtnDisabled]}
            onPress={handleRequestReset}
            disabled={!email || isLoading}
          >
            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Send Reset Code</Text>}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:       { flex: 1, backgroundColor: COLORS.background },
  container:  { flex: 1, backgroundColor: COLORS.background },
  content:    { paddingHorizontal: 24, alignItems: 'stretch' },
  backBtn:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 24, alignSelf: 'flex-start' },
  backBtnText: { fontSize: 15, fontFamily: 'Inter_500Medium', color: COLORS.primary },
  logoRow:    { alignItems: 'center', marginBottom: 32 },
  title:      { fontSize: 32, fontFamily: 'Inter_700Bold', color: COLORS.foreground, letterSpacing: -0.8, marginBottom: 6 },
  subtitle:   { fontSize: 16, fontFamily: 'Inter_400Regular', color: COLORS.muted, marginBottom: 36, lineHeight: 24 },
  form:       { gap: 16 },
  fieldGroup: { gap: 6 },
  label:      { fontSize: 14, fontFamily: 'Inter_500Medium', color: COLORS.foreground },
  input: {
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16, fontFamily: 'Inter_400Regular', color: COLORS.foreground,
  },
  codeInput:    { textAlign: 'center', fontSize: 28, fontFamily: 'Inter_600SemiBold', letterSpacing: 8 },
  passwordRow:  { flexDirection: 'row', alignItems: 'center' },
  passwordInput: { flex: 1, paddingRight: 48 },
  eyeBtn:       { position: 'absolute', right: 16, height: '100%', justifyContent: 'center' },
  fieldError:   { fontSize: 12, fontFamily: 'Inter_400Regular', color: COLORS.error, marginTop: 2 },
  errorRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FEF2F2', borderRadius: 10, padding: 12,
  },
  errorText:          { fontSize: 13, fontFamily: 'Inter_400Regular', color: COLORS.error, flex: 1 },
  primaryBtn:         { backgroundColor: COLORS.primary, borderRadius: 30, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnText:     { fontSize: 17, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  ghostBtn:           { alignItems: 'center', paddingVertical: 10 },
  ghostBtnText:       { fontSize: 15, fontFamily: 'Inter_500Medium', color: COLORS.muted },
});
