import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_ENDPOINTS } from '@/constants/api';
import { Colors } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
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
                Alert.alert('Error', 'Failed to load service details');
                router.back();
            }
        } catch (error) {
            console.error('❌ Error fetching service details:', error);
            Alert.alert('Error', 'Failed to load service details');
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

    const handleCall = (phoneNumber: string | null) => {
        if (!phoneNumber) {
            Alert.alert('Phone Number', 'Phone number not available');
            return;
        }
        const url = `tel:${phoneNumber}`;
        Linking.canOpenURL(url).then((supported) => {
            if (supported) Linking.openURL(url);
            else Alert.alert('Error', 'Phone dialer not available');
        });
    };

    const handleWhatsApp = (phoneNumber: string | null) => {
        if (!phoneNumber) {
            Alert.alert('Phone Number', 'Phone number not available');
            return;
        }
        let cleaned = phoneNumber.replace(/[^\d+]/g, '');
        if (!cleaned.startsWith('+')) {
            if (cleaned.startsWith('92')) cleaned = '+' + cleaned;
            else if (cleaned.startsWith('0')) cleaned = '+92' + cleaned.substring(1);
            else cleaned = '+92' + cleaned;
        }
        const url = `https://wa.me/${cleaned.replace(/\+/g, '')}`;
        Linking.canOpenURL(url).then((supported) => {
            if (supported) Linking.openURL(url);
            else Alert.alert('Error', 'WhatsApp not available');
        });
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
            return service.service_types;
        } else if (service.service_type) {
            return [service.service_type];
        } else {
            return ['Service'];
        }
    })();

    const formatServiceType = (type: string) => {
        if (!type) return 'Service';
        return type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ');
    };

    const serviceName = serviceTypes.length === 1
        ? formatServiceType(serviceTypes[0])
        : `${formatServiceType(serviceTypes[0])} +${serviceTypes.length - 1} more`;

    const providerName = service.user?.name || provider?.name || provider?.user?.name || 'Provider';
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
        service.location_details.forEach((loc: any) => {
            if (loc.display_text) {
                locations.push(loc.display_text);
            } else {
                const city = loc.city_name || loc.city || '';
                const area = loc.area || loc.area_name || '';
                if (city && area) {
                    locations.push(`${city}, ${area}`);
                } else if (area) {
                    locations.push(area);
                } else if (city) {
                    locations.push(city);
                }
            }
        });
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
            <Stack.Screen options={{ headerShown: false, title: 'Service Details' }} />
            <View style={[styles.container, { backgroundColor }]}>

                {/* Header */}
                <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                    <TouchableOpacity
                        onPress={() => {
                            if (router.canGoBack()) {
                                router.back();
                            } else {
                                router.push('/(tabs)/explore');
                            }
                        }}
                        style={[styles.backButton, { backgroundColor: cardBg, shadowColor: borderColor }]}
                    >
                        <IconSymbol name="chevron.left" size={24} color={textColor} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: textColor }]}>Service Details</Text>
                    <View style={{ width: 44 }} />
                </View>

                {/* Scrollable Content */}
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Decorative Background Elements */}
                    <View style={[styles.topCircle, { backgroundColor: primaryLight, opacity: 0.3 }]} />
                    <View style={[styles.bottomCircle, { backgroundColor: primaryLight, opacity: 0.2 }]} />

                    <View style={styles.contentContainer}>
                        {/* Service Card */}
                        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
                            <View style={styles.serviceHeader}>
                                <View style={[styles.iconContainer, { backgroundColor: primaryLight }]}>
                                    <IconSymbol name="wrench.fill" size={28} color={primaryColor} />
                                </View>
                                <View style={styles.serviceTitleContainer}>
                                    <Text style={[styles.serviceTitle, { color: textColor }]}>{serviceName}</Text>
                                    {monthlyRate > 0 && (
                                        <Text style={[styles.servicePrice, { color: primaryColor }]}>
                                            ₨{Math.floor(monthlyRate).toLocaleString()}
                                            <Text style={[styles.servicePricePeriod, { color: textSecondary }]}>/mo</Text>
                                        </Text>
                                    )}
                                </View>
                            </View>

                            {/* Service Types Tags */}
                            <View style={styles.section}>
                                <Text style={[styles.sectionLabel, { color: textColor }]}>Service Types</Text>
                                <View style={styles.tagsContainer}>
                                    {serviceTypes.length > 0 && serviceTypes[0] !== 'Service' ? (
                                        serviceTypes.map((serviceType: string, index: number) => {
                                            if (!serviceType || serviceType.trim() === '') return null;
                                            return (
                                                <View key={index} style={[styles.tag, { backgroundColor: primaryLight }]}>
                                                    <Text style={[styles.tagText, { color: primaryColor }]}>
                                                        {formatServiceType(serviceType)}
                                                    </Text>
                                                </View>
                                            );
                                        })
                                    ) : (
                                        <Text style={[styles.noDataText, { color: textSecondary }]}>No service types specified</Text>
                                    )}
                                </View>
                            </View>

                            {service.description && (
                                <View style={styles.section}>
                                    <Text style={[styles.sectionLabel, { color: textColor }]}>Description</Text>
                                    <Text style={[styles.description, { color: textSecondary }]}>{service.description}</Text>
                                </View>
                            )}

                            {/* Meta Info */}
                            <View style={styles.metaContainer}>
                                {service.work_type && (
                                    <View style={[styles.metaItem, { backgroundColor: 'transparent', borderColor }]}>
                                        <IconSymbol name="clock.fill" size={16} color={textSecondary} />
                                        <Text style={[styles.metaText, { color: textSecondary }]}>
                                            {service.work_type.charAt(0).toUpperCase() + service.work_type.slice(1).replace('_', ' ')}
                                        </Text>
                                    </View>
                                )}
                                {locations.length > 0 && (
                                    <View style={[styles.metaItem, { backgroundColor: 'transparent', borderColor }]}>
                                        <IconSymbol name="location.fill" size={16} color={textSecondary} />
                                        <Text style={[styles.metaText, { color: textSecondary }]}>
                                            {locations.length > 2
                                                ? `${locations[0]} +${locations.length - 1} more`
                                                : locations.join(', ')}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {/* Locations Tags */}
                            {locations.length > 0 && (
                                <View style={styles.locationsContainer}>
                                    <IconSymbol name="mappin.circle.fill" size={16} color={Colors.light.primary} />
                                    {locations.map((loc, index) => {
                                        if (!loc || loc.trim() === '') return null;
                                        return (
                                            <View key={index} style={[styles.locationTag, { borderColor }]}>
                                                <Text style={[styles.locationTagText, { color: textSecondary }]}>{loc}</Text>
                                            </View>
                                        );
                                    })}
                                </View>
                            )}
                        </View>

                        {/* Details Card */}
                        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
                            <Text style={[styles.cardTitle, { color: textColor }]}>Service Details</Text>
                            <View style={styles.detailsGrid}>
                                {service.work_type && (
                                    <View style={styles.detailItem}>
                                        <View style={[styles.detailIconContainer, { backgroundColor: primaryLight }]}>
                                            <IconSymbol name="clock.fill" size={18} color={primaryColor} />
                                        </View>
                                        <View style={styles.detailContent}>
                                            <Text style={[styles.detailLabel, { color: textSecondary }]}>Work Type</Text>
                                            <Text style={[styles.detailValue, { color: textColor }]}>
                                                {service.work_type.charAt(0).toUpperCase() + service.work_type.slice(1).replace('_', ' ')}
                                            </Text>
                                        </View>
                                    </View>
                                )}
                                {monthlyRate > 0 && (
                                    <View style={styles.detailItem}>
                                        <View style={[styles.detailIconContainer, { backgroundColor: primaryLight }]}>
                                            <IconSymbol name="dollarsign.circle.fill" size={18} color={primaryColor} />
                                        </View>
                                        <View style={styles.detailContent}>
                                            <Text style={[styles.detailLabel, { color: textSecondary }]}>Monthly Rate</Text>
                                            <Text style={[styles.detailValue, { color: textColor }]}>₨{Math.floor(monthlyRate).toLocaleString()}/mo</Text>
                                        </View>
                                    </View>
                                )}
                                {service.city && (
                                    <View style={styles.detailItem}>
                                        <View style={[styles.detailIconContainer, { backgroundColor: primaryLight }]}>
                                            <IconSymbol name="building.2.fill" size={18} color={primaryColor} />
                                        </View>
                                        <View style={styles.detailContent}>
                                            <Text style={[styles.detailLabel, { color: textSecondary }]}>City</Text>
                                            <Text style={[styles.detailValue, { color: textColor }]}>{service.city}</Text>
                                        </View>
                                    </View>
                                )}
                                {experience && (
                                    <View style={styles.detailItem}>
                                        <View style={[styles.detailIconContainer, { backgroundColor: primaryLight }]}>
                                            <IconSymbol name="star.fill" size={18} color={primaryColor} />
                                        </View>
                                        <View style={styles.detailContent}>
                                            <Text style={[styles.detailLabel, { color: textSecondary }]}>Experience</Text>
                                            <Text style={[styles.detailValue, { color: textColor }]}>{experience} {experience === 1 ? 'year' : 'years'}</Text>
                                        </View>
                                    </View>
                                )}
                                {verified && (
                                    <View style={styles.detailItem}>
                                        <View style={[styles.detailIconContainer, { backgroundColor: '#D1FAE5' }]}>
                                            <IconSymbol name="checkmark.seal.fill" size={18} color="#10B981" />
                                        </View>
                                        <View style={styles.detailContent}>
                                            <Text style={[styles.detailLabel, { color: textSecondary }]}>Verification</Text>
                                            <Text style={[styles.detailValue, { color: textColor }]}>Verified</Text>
                                        </View>
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* Provider Details Card */}
                        {(providerGender || providerReligion || (providerLanguages && providerLanguages.length > 0)) && (
                            <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
                                <Text style={[styles.cardTitle, { color: textColor }]}>Provider Details</Text>
                                <View style={styles.detailsGrid}>
                                    {providerGender && (
                                        <View style={styles.detailItem}>
                                            <View style={[styles.detailIconContainer, { backgroundColor: primaryLight }]}>
                                                <FontAwesome name="user" size={18} color={primaryColor} />
                                            </View>
                                            <View style={styles.detailContent}>
                                                <Text style={[styles.detailLabel, { color: textSecondary }]}>Gender</Text>
                                                <Text style={[styles.detailValue, { color: textColor }]}>
                                                    {providerGender.charAt(0).toUpperCase() + providerGender.slice(1)}
                                                </Text>
                                            </View>
                                        </View>
                                    )}
                                    {providerReligion && (
                                        <View style={styles.detailItem}>
                                            <View style={[styles.detailIconContainer, { backgroundColor: primaryLight }]}>
                                                <FontAwesome name="moon-o" size={18} color={primaryColor} />
                                            </View>
                                            <View style={styles.detailContent}>
                                                <Text style={[styles.detailLabel, { color: textSecondary }]}>Religion</Text>
                                                <Text style={[styles.detailValue, { color: textColor }]}>{providerReligion}</Text>
                                            </View>
                                        </View>
                                    )}
                                    {providerLanguages && providerLanguages.length > 0 && (
                                        <View style={styles.detailItem}>
                                            <View style={[styles.detailIconContainer, { backgroundColor: primaryLight }]}>
                                                <FontAwesome name="language" size={18} color={primaryColor} />
                                            </View>
                                            <View style={styles.detailContent}>
                                                <Text style={[styles.detailLabel, { color: textSecondary }]}>Languages</Text>
                                                <View style={[styles.tagsContainer, { marginTop: 4 }]}>
                                                    {providerLanguages.map((lang: any, index: number) => {
                                                        const langName = typeof lang === 'object' && lang.name ? lang.name : lang;
                                                        return (
                                                            <View key={index} style={[styles.tag, { backgroundColor: primaryLight, paddingVertical: 4, paddingHorizontal: 8 }]}>
                                                                <Text style={[styles.tagText, { color: primaryColor, fontSize: 12 }]}>{langName}</Text>
                                                            </View>
                                                        );
                                                    })}
                                                </View>
                                            </View>
                                        </View>
                                    )}
                                </View>
                            </View>
                        )}

                        {/* Provider Card */}
                        <Text style={[styles.sectionTitle, { color: textColor }]}>Service Provider</Text>
                        <TouchableOpacity
                            style={[styles.providerCard, { backgroundColor: cardBg, borderColor }]}
                            onPress={() => {
                                if (providerId) {
                                    const profileType = providerRole === 'business' ? 'business' : 'helper';
                                    router.push(`/profile/${profileType}/${providerId}`);
                                }
                            }}
                        >
                            <View style={styles.providerHeader}>
                                {providerImage ? (
                                    <Image source={{ uri: providerImage }} style={[styles.providerImage, { borderColor: cardBg }]} />
                                ) : (
                                    <View style={[styles.providerPlaceholder, { backgroundColor: primaryLight }]}>
                                        <Text style={[styles.providerInitial, { color: primaryColor }]}>{providerName.charAt(0).toUpperCase()}</Text>
                                    </View>
                                )}
                                <View style={styles.providerInfo}>
                                    <View style={styles.providerNameRow}>
                                        <Text style={[styles.providerName, { color: textColor }]}>{providerName}</Text>
                                        {verified && (
                                            <View style={styles.verifiedBadge}>
                                                <IconSymbol name="checkmark.seal.fill" size={14} color="#10B981" />
                                            </View>
                                        )}
                                    </View>
                                    <View style={styles.providerMetaRow}>
                                        <View style={styles.ratingContainer}>
                                            <IconSymbol name="star.fill" size={14} color="#F59E0B" />
                                            <Text style={[styles.ratingText, { color: textSecondary }]}>
                                                {provider?.rating ? Number(provider.rating).toFixed(1) : 'New'}
                                            </Text>
                                        </View>
                                        {provider?.reviews_count > 0 && (
                                            <>
                                                <Text style={[styles.metaSeparator, { color: textSecondary }]}>•</Text>
                                                <Text style={[styles.reviewsText, { color: textSecondary }]}>{provider.reviews_count} reviews</Text>
                                            </>
                                        )}
                                    </View>
                                </View>
                                <IconSymbol name="chevron.right" size={20} color={textSecondary} />
                            </View>
                        </TouchableOpacity>

                        {/* Other Services */}
                        {otherServices.length > 0 && (
                            <View style={styles.otherServicesSection}>
                                <Text style={[styles.sectionTitle, { color: textColor }]}>More Services from {providerName}</Text>
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={{ paddingRight: 20 }}
                                >
                                    {otherServices.map((item, index) => {
                                        const otherServiceTypes = item.service_types && Array.isArray(item.service_types) && item.service_types.length > 0
                                            ? item.service_types
                                            : item.service_type
                                                ? [item.service_type]
                                                : ['Service'];

                                        const otherServiceName = otherServiceTypes.length === 1
                                            ? formatServiceType(otherServiceTypes[0])
                                            : `${formatServiceType(otherServiceTypes[0])} +${otherServiceTypes.length - 1} more`;

                                        const otherMonthlyRate = parseFloat(item.monthly_rate || '0');

                                        return (
                                            <TouchableOpacity
                                                key={index}
                                                style={[styles.miniCard, { backgroundColor: cardBg, borderColor }]}
                                                onPress={() => router.push(`/service/${item.id}`)}
                                            >
                                                <View style={[styles.miniCardIcon, { backgroundColor: primaryLight }]}>
                                                    <IconSymbol name="wrench.fill" size={20} color={primaryColor} />
                                                </View>
                                                <Text style={[styles.miniCardTitle, { color: textColor }]} numberOfLines={1}>
                                                    {otherServiceName}
                                                </Text>
                                                <Text style={[styles.miniCardPrice, { color: textSecondary }]}>
                                                    {otherMonthlyRate > 0 ? `₨${Math.floor(otherMonthlyRate).toLocaleString()}` : 'Contact'}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </ScrollView>
                            </View>
                        )}
                    </View>
                </ScrollView>

                {/* Bottom Action Bar */}
                <View style={[styles.bottomBar, { backgroundColor: cardBg, borderColor, paddingBottom: insets.bottom + 16 }]}>
                    <View style={styles.bottomActions}>
                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB', borderWidth: 1 }]}
                            onPress={() => handleCall(phoneNumber)}
                        >
                            <IconSymbol name="phone.fill" size={24} color="#374151" />
                            <Text style={[styles.actionBtnText, { color: '#374151' }]}>Call</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: '#25D366' }]}
                            onPress={() => handleWhatsApp(phoneNumber)}
                        >
                            <FontAwesome name="whatsapp" size={24} color="#FFFFFF" />
                            <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>WhatsApp</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: primaryColor }]}
                            onPress={() => router.push(`/chat/${providerId}`)}
                        >
                            <IconSymbol name="message.fill" size={24} color="#FFFFFF" />
                            <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>Message</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    topCircle: {
        position: 'absolute',
        top: -width * 0.4,
        right: -width * 0.2,
        width: width * 0.8,
        height: width * 0.8,
        borderRadius: width * 0.4,
    },
    bottomCircle: {
        position: 'absolute',
        bottom: -width * 0.3,
        left: -width * 0.2,
        width: width * 0.7,
        height: width * 0.7,
        borderRadius: width * 0.35,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    contentContainer: {
        paddingHorizontal: 20,
    },
    card: {
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.02,
        shadowRadius: 10,
        elevation: 1,
    },
    serviceHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 16,
        marginBottom: 20,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    serviceTitleContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    serviceTitle: {
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 4,
    },
    servicePrice: {
        fontSize: 24,
        fontWeight: '800',
    },
    servicePricePeriod: {
        fontSize: 14,
        fontWeight: '600',
    },
    section: {
        marginBottom: 16,
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    description: {
        fontSize: 15,
        lineHeight: 24,
    },
    metaContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
    },
    metaText: {
        fontSize: 13,
        fontWeight: '500',
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tag: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
    },
    tagText: {
        fontSize: 13,
        fontWeight: '600',
    },
    locationsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        alignItems: 'center',
    },
    locationTag: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
        borderWidth: 1,
    },
    locationTagText: {
        fontSize: 12,
        fontWeight: '500',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
    },
    detailsGrid: {
        gap: 12,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    detailIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    detailContent: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 12,
        marginBottom: 2,
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '600',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 12,
    },
    providerCard: {
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: 24,
    },
    providerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    providerImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 2,
    },
    providerPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
    },
    providerInitial: {
        fontSize: 20,
        fontWeight: '700',
    },
    providerInfo: {
        flex: 1,
    },
    providerNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 2,
    },
    providerName: {
        fontSize: 16,
        fontWeight: '700',
    },
    verifiedBadge: {
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#D1FAE5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    providerMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingText: {
        fontSize: 13,
        fontWeight: '600',
    },
    metaSeparator: {
        fontSize: 12,
    },
    reviewsText: {
        fontSize: 13,
        fontWeight: '500',
    },
    otherServicesSection: {
        marginBottom: 24,
    },
    miniCard: {
        width: 150,
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        marginRight: 12,
    },
    miniCardIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    miniCardTitle: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 2,
    },
    miniCardPrice: {
        fontSize: 12,
        fontWeight: '500',
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 10,
    },
    bottomActions: {
        flexDirection: 'row',
        gap: 12,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'column', // Matched profile buttons
        alignItems: 'center',
        justifyContent: 'center',
        height: 72,
        borderRadius: 16,
        gap: 4,
        paddingVertical: 12,
    },
    actionBtnText: {
        fontSize: 12,
        fontWeight: '600',
    },
    noDataText: {
        fontSize: 13,
        fontStyle: 'italic',
    },
});
