import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_ENDPOINTS } from '@/constants/api';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useTranslation } from '@/hooks/useTranslation';
import { apiService } from '@/services/api';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function ServiceDetailScreen() {
    const { id } = useLocalSearchParams();
    const { t } = useTranslation();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(true);
    const [service, setService] = useState<any>(null);
    const [provider, setProvider] = useState<any>(null);
    const [otherServices, setOtherServices] = useState<any[]>([]);

    // Theme colors
    const backgroundColor = useThemeColor({}, 'background');
    const textColor = useThemeColor({}, 'text');
    const textSecondary = useThemeColor({}, 'textSecondary');
    const primaryColor = useThemeColor({}, 'primary');
    const primaryLight = useThemeColor({}, 'primaryLight');
    const cardBg = useThemeColor({}, 'card');
    const borderColor = useThemeColor({}, 'border');

    useEffect(() => {
        fetchServiceDetails();
    }, [id]);

    const fetchServiceDetails = async () => {
        try {
            setLoading(true);
            const response = await apiService.get(
                API_ENDPOINTS.SERVICE_LISTINGS.GET,
                { id: id as string }
            );

            if (response.success && response.data) {
                let serviceData = response.data;

                if (response.data.listing) {
                    serviceData = response.data.listing;
                } else if (response.data.service_listing) {
                    serviceData = response.data.service_listing;
                }

                setService(serviceData);

                const providerData = serviceData.user || serviceData.helper || serviceData.business;

                if (providerData) {
                    setProvider(providerData);

                    if (serviceData.other_listings && Array.isArray(serviceData.other_listings) && serviceData.other_listings.length > 0) {
                        const others = serviceData.other_listings.filter((s: any) => s.id.toString() !== id?.toString());
                        setOtherServices(others);
                    } else if (response.data.other_listings && Array.isArray(response.data.other_listings) && response.data.other_listings.length > 0) {
                        const others = response.data.other_listings.filter((s: any) => s.id.toString() !== id?.toString());
                        setOtherServices(others);
                    } else if (serviceData.other_services && Array.isArray(serviceData.other_services) && serviceData.other_services.length > 0) {
                        const others = serviceData.other_services.filter((s: any) => s.id.toString() !== id?.toString());
                        setOtherServices(others);
                    } else if (providerData.id) {
                        fetchOtherServices(providerData.id);
                    } else {
                        setOtherServices([]);
                    }
                }
            } else {
                Alert.alert(t('common.error'), t('serviceDetail.loadErrorMessage'));
                router.back();
            }
        } catch (error) {
            console.error('❌ Error fetching service details:', error);
            Alert.alert(t('common.error'), t('serviceDetail.loadErrorMessage'));
            router.back();
        } finally {
            setLoading(false);
        }
    };

    const fetchOtherServices = async (providerId: string | number) => {
        try {
            let response = await apiService.get(
                API_ENDPOINTS.HELPERS.GET,
                { id: providerId.toString() }
            );

            if (!response.success || !response.data) {
                response = await apiService.get(
                    API_ENDPOINTS.BUSINESSES.GET,
                    { id: providerId.toString() }
                );
            }

            if (response.success && response.data) {
                const profileData = response.data;
                let allServices: any[] = [];
                if (profileData.service_listings && Array.isArray(profileData.service_listings)) {
                    allServices = [...profileData.service_listings];
                } else if (profileData.services && Array.isArray(profileData.services)) {
                    allServices = [...profileData.services];
                }

                const others = allServices.filter((s: any) => s.id.toString() !== id?.toString());
                setOtherServices(others);
            }
        } catch (error) {
            console.log('Error fetching other services:', error);
        }
    };

    const handleCall = async (phoneNumber: string | null) => {
        if (!phoneNumber) {
            Alert.alert(t('serviceDetail.phoneErrorTitle'), t('serviceDetail.phoneErrorMessage'));
            return;
        }
        const url = `tel:${phoneNumber}`;
        try {
            await Linking.openURL(url);
        } catch (err) {
            Alert.alert(t('common.error'), 'Unable to open phone dialer');
        }
    };

    const handleWhatsApp = async (phoneNumber: string | null) => {
        if (!phoneNumber) {
            Alert.alert(t('serviceDetail.phoneErrorTitle'), t('serviceDetail.phoneErrorMessage'));
            return;
        }
        let cleaned = phoneNumber.replace(/[^\d+]/g, '');
        if (!cleaned.startsWith('+')) {
            if (cleaned.startsWith('92')) cleaned = '+' + cleaned;
            else if (cleaned.startsWith('0')) cleaned = '+92' + cleaned.substring(1);
            else cleaned = '+92' + cleaned;
        }

        // Use whatsapp:// scheme first as it provides better UX if installed, fallback to web
        const appUrl = `whatsapp://send?phone=${cleaned}`;
        const webUrl = `https://wa.me/${cleaned.replace(/\+/g, '')}`;

        try {
            await Linking.openURL(appUrl);
        } catch (err) {
            try {
                await Linking.openURL(webUrl);
            } catch (webErr) {
                Alert.alert(t('serviceDetail.whatsappErrorTitle'), t('serviceDetail.whatsappErrorMessage'));
            }
        }
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor }]}>
                <ActivityIndicator size="large" color={primaryColor} />
            </View>
        );
    }

    if (!service) return null;

    const serviceTypes = (() => {
        if (service.service_types && Array.isArray(service.service_types) && service.service_types.length > 0) {
            // Check if array contains strings or objects
            return service.service_types.map((t: any) => {
                if (typeof t === 'string') return t;
                if (typeof t === 'object' && t) return t.name || t.label || t.slug || t('serviceDetail.service');
                return t('serviceDetail.service');
            });
        } else if (service.service_type) {
            const t = service.service_type;
            if (typeof t === 'string') return [t];
            if (typeof t === 'object' && t) return [t.name || t.label || t.slug || t('serviceDetail.service')];
            return [String(t)];
        } else {
            return [t('serviceDetail.service')];
        }
    })();

    const formatServiceType = (type: string) => {
        if (!type) return t('serviceDetail.service');
        return type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ');
    };

    const serviceName = serviceTypes.length === 1
        ? formatServiceType(serviceTypes[0])
        : `${formatServiceType(serviceTypes[0])} +${serviceTypes.length - 1} ${t('serviceDetail.more')}`;

    const providerName = service.user?.name || provider?.name || provider?.user?.name || t('serviceDetail.provider');
    const providerImage = service.user?.profile_image || provider?.profile_image || provider?.user?.profile_image || service.profile?.photo;
    const providerId = service.user?.id || provider?.id || provider?.user?.id;
    const phoneNumber = service.user?.phone || provider?.phone_number || provider?.phoneNumber || provider?.user?.phone_number;
    const experience = provider?.experience_years || provider?.user?.experience_years;
    const verified = provider?.verified || provider?.is_verified || provider?.user?.verified || provider?.user?.is_verified;
    const providerRole = provider?.role || provider?.user_type || provider?.user?.role || provider?.user?.user_type || 'helper';
    const providerGender = service.user?.gender || provider?.gender || provider?.user?.gender;
    const providerReligion = service.user?.religion || provider?.religion || provider?.user?.religion;
    const providerLanguages = service.user?.languages || provider?.languages || provider?.user?.languages || [];

    const locations: string[] = [];

    if (service.location_details && Array.isArray(service.location_details) && service.location_details.length > 0) {
        // Extract areas directly from location_details objects as requested
        const areas = service.location_details
            .map((loc: any) => loc.area) // User specified 'area' key inside location_details objects
            .filter((a: any) => a && typeof a === 'string' && a.trim() !== '');

        if (areas.length > 0) {
            locations.push(...areas);
        }
    } else if (service.area && service.city) {
        locations.push(`${service.city}, ${service.area}`);
    } else if (service.area) {
        locations.push(service.area);
    } else if (service.city) {
        locations.push(service.city);
    }

    const monthlyRate = parseFloat(service.monthly_rate || '0');

    return (
        <>
            <Stack.Screen options={{ headerShown: false, title: t('serviceDetail.title') }} />
            <View style={[styles.container, { backgroundColor }]}>
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={{ paddingBottom: 120 }}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                >
                    {/* Hero Header */}
                    <View style={{ backgroundColor: primaryColor, paddingHorizontal: 20, paddingTop: insets.top + 10, paddingBottom: 60 }}>
                        {/* Nav */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                            <TouchableOpacity
                                onPress={() => router.canGoBack() ? router.back() : router.push('/(tabs)/explore')}
                                style={{
                                    width: 40, height: 40, borderRadius: 20,
                                    backgroundColor: 'rgba(255,255,255,0.2)',
                                    alignItems: 'center', justifyContent: 'center'
                                }}
                            >
                                <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
                            </TouchableOpacity>
                            <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700' }}>{t('serviceDetail.title')}</Text>
                            <View style={{ width: 40 }} />
                        </View>

                        {/* Service Title & Price */}
                        <View>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                                {serviceTypes.slice(0, 3).map((t: string, i: number) => (
                                    <View key={i} style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                                        <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600' }}>{formatServiceType(t)}</Text>
                                    </View>
                                ))}
                            </View>
                            <Text style={{ color: '#FFFFFF', fontSize: 26, fontWeight: '800', marginBottom: 8, lineHeight: 32 }}>
                                {serviceName}
                            </Text>
                            {monthlyRate > 0 ? (
                                <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: '700' }}>
                                    ₨{Math.floor(monthlyRate).toLocaleString()}
                                    <Text style={{ fontSize: 14, fontWeight: '500', opacity: 0.9 }}>{t('serviceDetail.perMonth')}</Text>
                                </Text>
                            ) : (
                                <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '700', opacity: 0.9 }}>
                                    {t('serviceDetail.priceNegotiable')}
                                </Text>
                            )}
                        </View>
                    </View>

                    {/* Content Container (Overlapping) */}
                    <View style={{ flex: 1, marginTop: -40, paddingHorizontal: 20 }}>

                        {/* Provider ID Card */}
                        <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={() => {
                                if (providerId) {
                                    const profileType = providerRole === 'business' ? 'business' : 'helper';
                                    router.push(`/profile/${profileType}/${providerId}`);
                                }
                            }}
                            style={[styles.providerCard, { backgroundColor: cardBg, borderColor: borderColor }]}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                {/* Avatar */}
                                <View style={{
                                    width: 64, height: 64, borderRadius: 32,
                                    backgroundColor: backgroundColor,
                                    padding: 3, marginRight: 16
                                }}>
                                    <View style={{ flex: 1, borderRadius: 30, overflow: 'hidden', backgroundColor: primaryLight, alignItems: 'center', justifyContent: 'center' }}>
                                        {providerImage ? (
                                            <Image source={{ uri: providerImage }} style={{ width: '100%', height: '100%' }} />
                                        ) : (
                                            <Text style={{ fontSize: 20, fontWeight: '700', color: primaryColor }}>
                                                {providerName.charAt(0).toUpperCase()}
                                            </Text>
                                        )}
                                    </View>
                                </View>

                                {/* Info */}
                                <View style={{ flex: 1 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                        <Text style={{ fontSize: 18, fontWeight: '700', color: textColor }} numberOfLines={1}>{providerName}</Text>
                                        {verified && <IconSymbol name="checkmark.seal.fill" size={16} color="#10B981" />}
                                    </View>
                                </View>


                                <IconSymbol name="chevron.right" size={20} color={textSecondary} />
                            </View>
                        </TouchableOpacity>

                        {/* Description */}
                        {service.description && (
                            <View style={{ marginBottom: 24 }}>
                                <Text style={[styles.sectionTitle, { color: textColor }]}>{t('serviceDetail.aboutService')}</Text>
                                <Text style={{ fontSize: 15, lineHeight: 24, color: textSecondary }}>{service.description}</Text>
                            </View>
                        )}

                        {/* Service Details Grid */}
                        <View style={{ marginBottom: 24 }}>
                            <Text style={[styles.sectionTitle, { color: textColor }]}>{t('serviceDetail.serviceDetails')}</Text>
                            <View style={styles.gridContainer}>
                                {service.work_type && (
                                    <View style={[styles.gridItem, { backgroundColor: cardBg, borderColor }]}>
                                        <Text style={[styles.gridLabel, { color: textSecondary }]}>{t('serviceDetail.workType')}</Text>
                                        <Text style={[styles.gridValue, { color: textColor }]}>
                                            {service.work_type.charAt(0).toUpperCase() + service.work_type.slice(1).replace('_', ' ')}
                                        </Text>
                                    </View>
                                )}
                                {(locations.length > 0 || service.city) && (
                                    <View style={[styles.gridItem, { backgroundColor: cardBg, borderColor }]}>
                                        <Text style={[styles.gridLabel, { color: textSecondary }]}>{locations.length > 1 ? t('serviceDetail.locations') : t('serviceDetail.location')}</Text>
                                        <Text style={[styles.gridValue, { color: textColor }]} numberOfLines={2}>
                                            {locations.length > 0 ? locations.join(', ') : service.city}
                                        </Text>
                                    </View>
                                )}
                                {experience && (
                                    <View style={[styles.gridItem, { backgroundColor: cardBg, borderColor }]}>
                                        <Text style={[styles.gridLabel, { color: textSecondary }]}>{t('serviceDetail.experience')}</Text>
                                        <Text style={[styles.gridValue, { color: textColor }]}>{experience} {t('serviceDetail.years')}</Text>
                                    </View>
                                )}
                                <View style={[styles.gridItem, { backgroundColor: cardBg, borderColor }]}>
                                    <Text style={[styles.gridLabel, { color: textSecondary }]}>{t('serviceDetail.posted')}</Text>
                                    <Text style={[styles.gridValue, { color: textColor }]}>{t('serviceDetail.recently')}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Provider Attributes */}
                        {(providerGender || providerReligion || (providerLanguages && providerLanguages.length > 0)) && (
                            <View style={{ marginBottom: 24 }}>
                                <Text style={[styles.sectionTitle, { color: textColor }]}>{t('serviceDetail.providerInfo')}</Text>
                                <View style={styles.gridContainer}>
                                    {providerGender && (
                                        <View style={[styles.gridItem, { backgroundColor: cardBg, borderColor }]}>
                                            <Text style={[styles.gridLabel, { color: textSecondary }]}>{t('serviceDetail.gender')}</Text>
                                            <Text style={[styles.gridValue, { color: textColor }]}>
                                                {providerGender.charAt(0).toUpperCase() + providerGender.slice(1)}
                                            </Text>
                                        </View>
                                    )}
                                    {providerReligion && (
                                        <View style={[styles.gridItem, { backgroundColor: cardBg, borderColor }]}>
                                            <Text style={[styles.gridLabel, { color: textSecondary }]}>{t('serviceDetail.religion')}</Text>
                                            <Text style={[styles.gridValue, { color: textColor }]}>{typeof providerReligion === 'object' ? (providerReligion as any).label : providerReligion}</Text>
                                        </View>
                                    )}
                                    {providerLanguages && providerLanguages.length > 0 && (
                                        <View style={[styles.gridItem, { backgroundColor: cardBg, borderColor, flexBasis: '100%' }]}>
                                            <Text style={[styles.gridLabel, { color: textSecondary }]}>{t('serviceDetail.languages')}</Text>
                                            <Text style={[styles.gridValue, { color: textColor }]}>
                                                {providerLanguages.map((l: any) => typeof l === 'object' ? l.name : l).join(', ')}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        )}

                        {/* Other Services */}
                        {otherServices.length > 0 && (
                            <View style={{ marginBottom: 24 }}>
                                <Text style={[styles.sectionTitle, { color: textColor }]}>{t('serviceDetail.moreFrom')} {providerName}</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 20 }}>
                                    {otherServices.map((item, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={{
                                                width: 160, padding: 12, borderRadius: 16,
                                                backgroundColor: cardBg, borderWidth: 1, borderColor: borderColor
                                            }}
                                            onPress={() => router.push(`/service/${item.id}`)}
                                        >
                                            <View style={{
                                                width: 40, height: 40, borderRadius: 12,
                                                backgroundColor: primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 10
                                            }}>
                                                <IconSymbol name="wrench.fill" size={20} color={primaryColor} />
                                            </View>
                                            <Text style={{ fontSize: 14, fontWeight: '700', color: textColor, marginBottom: 4 }} numberOfLines={2}>
                                                {(() => {
                                                    const st = item.service_type || t('serviceDetail.service');
                                                    if (typeof st === 'string') return st;
                                                    if (typeof st === 'object' && st) return st.name || st.label || st.slug || t('serviceDetail.service');
                                                    return t('serviceDetail.service');
                                                })()}
                                            </Text>
                                            <Text style={{ fontSize: 13, color: primaryColor, fontWeight: '600' }}>
                                                {t('serviceDetail.viewDetails')}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                    </View>
                </ScrollView >

                {/* Sticky Bottom Bar */}
                <View style={[styles.bottomBar, { backgroundColor: cardBg, borderColor: borderColor, paddingBottom: insets.bottom + 12 }]}>
                    <View style={styles.bottomActions}>
                        <TouchableOpacity
                            style={[styles.iconButton, { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' }]}
                            onPress={() => handleCall(phoneNumber)}
                        >
                            <IconSymbol name="phone.fill" size={22} color="#374151" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.iconButton, { backgroundColor: '#DCFCE7', borderColor: '#BBF7D0' }]}
                            onPress={() => handleWhatsApp(phoneNumber)}
                        >
                            <FontAwesome name="whatsapp" size={24} color="#16A34A" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.primaryButton, { backgroundColor: primaryColor }]}
                            onPress={() => router.push(`/chat/${providerId}`)}
                        >
                            <IconSymbol name="message.fill" size={20} color="#FFFFFF" />
                            <Text style={styles.primaryButtonText}>{t('serviceDetail.message')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </>
    );

}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollView: { flex: 1 },
    providerCard: {
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4
    },
    sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 12 },
    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    gridItem: {
        flexBasis: '48%',
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
    },
    gridLabel: { fontSize: 12, marginBottom: 4, fontWeight: '500' },
    gridValue: { fontSize: 15, fontWeight: '700' },
    bottomBar: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        paddingTop: 16, paddingHorizontal: 20,
        borderTopWidth: 1,
        shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 10
    },
    bottomActions: { flexDirection: 'row', gap: 12 },
    iconButton: {
        width: 50, height: 50, borderRadius: 25,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1,
    },
    primaryButton: {
        flex: 1, height: 50, borderRadius: 25,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3
    },
    primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
