import React, { createContext, useContext, useEffect } from "react";
import { Platform } from "react-native";
import Purchases, { type PurchasesPackage } from "react-native-purchases";
import { useMutation, useQuery } from "@tanstack/react-query";
import Constants from "expo-constants";
import { useUser } from "@clerk/expo";

const ADMIN_EMAILS = ["michaelmeusch@gmail.com", "hruns2000@gmail.com"];
const isTestEmail = (email: string) => email.includes("test");

const REVENUECAT_TEST_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY;
const REVENUECAT_IOS_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;
const REVENUECAT_ANDROID_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;

export const REVENUECAT_ENTITLEMENT_IDENTIFIER = "pro";
export const REVENUECAT_EXPORT_ENTITLEMENT = "book_export";
export const REVENUECAT_ILLUSTRATION_ENTITLEMENT = "book_illustrations";
export const REVENUECAT_SEO_ENTITLEMENT = "seo_keywords";

let initError: string | null = null;

function getRevenueCatApiKey() {
  if (!REVENUECAT_TEST_API_KEY || !REVENUECAT_IOS_API_KEY || !REVENUECAT_ANDROID_API_KEY) {
    throw new Error("RevenueCat Public API Keys not found");
  }

  if (__DEV__ || Platform.OS === "web" || Constants.executionEnvironment === "storeClient") {
    return REVENUECAT_TEST_API_KEY;
  }

  if (Platform.OS === "ios") return REVENUECAT_IOS_API_KEY;
  if (Platform.OS === "android") return REVENUECAT_ANDROID_API_KEY;

  return REVENUECAT_TEST_API_KEY;
}

export function initializeRevenueCat() {
  try {
    const apiKey = getRevenueCatApiKey();
    if (!apiKey) throw new Error("RevenueCat Public API Key not found");

    if (__DEV__) {
      Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
    }
    Purchases.configure({ apiKey });

    console.log("Configured RevenueCat");
    initError = null;
  } catch (err) {
    initError = err instanceof Error ? err.message : "RevenueCat initialization failed";
    console.warn("[RevenueCat] Init failed:", initError);
  }
}

function useSubscriptionContext() {
  const { user } = useUser();
  const userEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase() ?? "";
  const isAdmin = ADMIN_EMAILS.includes(userEmail) || isTestEmail(userEmail);

  const customerInfoQuery = useQuery({
    queryKey: ["revenuecat", "customer-info", user?.id ?? "anonymous"],
    queryFn: async () => {
      if (initError) throw new Error(initError);
      const info = await Purchases.getCustomerInfo();
      return info;
    },
    staleTime: 60 * 1000,
    retry: initError ? false : 3,
  });

  const offeringsQuery = useQuery({
    queryKey: ["revenuecat", "offerings"],
    queryFn: async () => {
      if (initError) throw new Error(initError);
      const offerings = await Purchases.getOfferings();
      return offerings;
    },
    staleTime: 300 * 1000,
    retry: initError ? false : 3,
  });

  useEffect(() => {
    customerInfoQuery.refetch();
  }, [user?.id]);

  const purchaseMutation = useMutation({
    mutationFn: async (packageToPurchase: PurchasesPackage) => {
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      return customerInfo;
    },
    onSuccess: () => customerInfoQuery.refetch(),
  });

  const restoreMutation = useMutation({
    mutationFn: async () => {
      return Purchases.restorePurchases();
    },
    onSuccess: () => customerInfoQuery.refetch(),
  });

  const isSubscribed =
    isAdmin ||
    customerInfoQuery.data?.entitlements.active?.[REVENUECAT_ENTITLEMENT_IDENTIFIER] !== undefined;

  const hasSeoKeywords =
    isAdmin ||
    customerInfoQuery.data?.entitlements.active?.[REVENUECAT_SEO_ENTITLEMENT] !== undefined;

  const seoPackage =
    offeringsQuery.data?.all?.["seo_keywords"]?.availablePackages?.[0] ??
    offeringsQuery.data?.current?.availablePackages?.find(
      (p) => p.identifier === "seo_keywords"
    ) ??
    null;

  return {
    customerInfo: customerInfoQuery.data,
    offerings: offeringsQuery.data,
    isSubscribed,
    hasSeoKeywords,
    seoPackage,
    isLoading: customerInfoQuery.isLoading || customerInfoQuery.isFetching || offeringsQuery.isLoading || offeringsQuery.isFetching,
    initError,
    purchase: purchaseMutation.mutateAsync,
    restore: restoreMutation.mutateAsync,
    isPurchasing: purchaseMutation.isPending,
    isRestoring: restoreMutation.isPending,
  };
}

type SubscriptionContextValue = ReturnType<typeof useSubscriptionContext>;
const Context = createContext<SubscriptionContextValue | null>(null);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const value = useSubscriptionContext();
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useSubscription() {
  const ctx = useContext(Context);
  if (!ctx) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return ctx;
}
