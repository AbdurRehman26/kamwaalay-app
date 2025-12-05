import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_ENDPOINTS } from '@/constants/api';
import { Colors } from '@/constants/theme';
import { apiService } from '@/services/api';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ServiceDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(true);
    const [service, setService] = useState<any>(null);
    const [provider, setProvider] = useState<any>(null);
    const [otherServices, setOtherServices] = useState<any[]>([]);

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

            console.log('📦 Service Details API Response:', JSON.stringify(response, null, 2));

            if (response.success && response.data) {
                const serviceData = response.data;
                console.log('✅ Service Data:', JSON.stringify(serviceData, null, 2));
                setService(serviceData);

                // Extract provider info - user is directly in the response
                const providerData = serviceData.user || serviceData.helper || serviceData.business;
                console.log('👤 Provider Data:', JSON.stringify(providerData, null, 2));
                
                if (providerData) {
                    setProvider(providerData);

                    // Check if other_services is already in the response
                    if (serviceData.other_services && Array.isArray(serviceData.other_services)) {
                        const others = serviceData.other_services.filter((s: any) => s.id.toString() !== id?.toString());
                        setOtherServices(others);
                    } else if (providerData.id) {
                        fetchOtherServices(providerData.id);
                    }
                }
            } else {
                console.error('❌ Failed to load service details:', response);
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
            // Try helper endpoint first
            let response = await apiService.get(
                API_ENDPOINTS.HELPERS.GET,
                { id: providerId.toString() }
            );

            // If helper endpoint fails or returns no data, try business endpoint
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
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.light.primary} />
            </View>
        );
    }

    if (!service) return null;

    // Get service types - use service_types array if available, otherwise fallback to service_type
    const serviceTypes = service.service_types && Array.isArray(service.service_types) && service.service_types.length > 0
        ? service.service_types
        : service.service_type
        ? [service.service_type]
        : ['Service'];

    // Format service type names
    const formatServiceType = (type: string) => {
        return type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ');
    };

    const serviceName = serviceTypes.length === 1 
        ? formatServiceType(serviceTypes[0])
        : `${formatServiceType(serviceTypes[0])} +${serviceTypes.length - 1} more`;

    // Extract provider info from user object
    const providerName = service.user?.name || provider?.name || provider?.user?.name || 'Provider';
    const providerImage = service.user?.profile_image || provider?.profile_image || provider?.user?.profile_image || service.profile?.photo;
    const providerId = service.user?.id || provider?.id || provider?.user?.id;
    const phoneNumber = service.user?.phone || provider?.phone_number || provider?.phoneNumber || provider?.user?.phone_number;
    const experience = provider?.experience_years || provider?.user?.experience_years;
    const verified = provider?.verified || provider?.is_verified || provider?.user?.verified || provider?.user?.is_verified;
    const providerRole = provider?.role || provider?.user_type || provider?.user?.role || provider?.user?.user_type || 'helper';

    // Format locations from location_details - use display_text if available
    const locations: string[] = [];
    if (service.location_details && Array.isArray(service.location_details)) {
        service.location_details.forEach((loc: any) => {
            // Prefer display_text, then city_name + area, then individual fields
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

    // Parse monthly_rate (it's a string)
    const monthlyRate = parseFloat(service.monthly_rate || '0');

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Header Background */}
                <View style={styles.headerBackground}>
                    <View style={[styles.headerContent, { paddingTop: insets.top + 10 }]}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Service Details</Text>
                        <View style={{ width: 40 }} />
                    </View>
                </View>

                {/* Content Container */}
                <View style={styles.contentContainer}>
                    {/* Service Card */}
                    <View style={styles.serviceCard}>
                        <View style={styles.serviceHeader}>
                            <View style={styles.iconContainer}>
                                <IconSymbol name="wrench.fill" size={28} color={Colors.light.primary} />
                            </View>
                            <View style={styles.serviceTitleContainer}>
                                <Text style={styles.serviceTitle}>{serviceName}</Text>
                                {monthlyRate > 0 && (
                                    <Text style={styles.servicePrice}>
                                        ₨{Math.floor(monthlyRate).toLocaleString()}
                                        <Text style={styles.servicePricePeriod}>/mo</Text>
                                    </Text>
                                )}
                            </View>
                        </View>

                        <View style={styles.divider} />

                        {/* Service Types Tags - Always show */}
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>Service Types</Text>
                            <View style={styles.tagsContainer}>
                                {serviceTypes.length > 0 ? (
                                    serviceTypes.map((serviceType: string, index: number) => (
                                        <View key={index} style={styles.serviceTag}>
                                            <Text style={styles.serviceTagText}>
                                                {formatServiceType(serviceType)}
                                            </Text>
                                        </View>
                                    ))
                                ) : (
                                    <Text style={styles.noDataText}>No service types specified</Text>
                                )}
                            </View>
                        </View>

                        {service.description && (
                            <View style={styles.section}>
                                <Text style={styles.sectionLabel}>Description</Text>
                                <Text style={styles.description}>{service.description}</Text>
                            </View>
                        )}

                        <View style={styles.metaContainer}>
                            {service.work_type && (
                                <View style={styles.metaItem}>
                                    <IconSymbol name="clock.fill" size={16} color="#6B7280" />
                                    <Text style={styles.metaText}>
                                        {service.work_type.charAt(0).toUpperCase() + service.work_type.slice(1).replace('_', ' ')}
                                    </Text>
                                </View>
                            )}
                            {service.status && (
                                <View style={styles.metaItem}>
                                    <IconSymbol name="checkmark.circle.fill" size={16} color={service.status === 'active' ? '#10B981' : '#6B7280'} />
                                    <Text style={styles.metaText}>
                                        {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                                    </Text>
                                </View>
                            )}

                            {locations.length > 0 && (
                                <View style={styles.metaItem}>
                                    <IconSymbol name="location.fill" size={16} color="#6B7280" />
                                    <Text style={styles.metaText}>
                                        {locations.length > 2
                                            ? `${locations[0]} +${locations.length - 1} more`
                                            : locations.join(', ')}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* All Locations Tags */}
                        {locations.length > 0 && (
                            <View style={styles.locationsContainer}>
                                <IconSymbol name="mappin.circle.fill" size={16} color="#8B5CF6" />
                                {locations.map((loc, index) => (
                                    <View key={index} style={styles.locationTag}>
                                        <Text style={styles.locationTagText}>{loc}</Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Details Card - Always show */}
                    <View style={styles.detailsCard}>
                        <Text style={styles.detailsTitle}>Service Details</Text>
                        <View style={styles.detailsGrid}>
                            {service.work_type && (
                                <View style={styles.detailItem}>
                                    <View style={styles.detailIconContainer}>
                                        <IconSymbol name="clock.fill" size={18} color={Colors.light.primary} />
                                    </View>
                                    <View style={styles.detailContent}>
                                        <Text style={styles.detailLabel}>Work Type</Text>
                                        <Text style={styles.detailValue}>
                                            {service.work_type.charAt(0).toUpperCase() + service.work_type.slice(1).replace('_', ' ')}
                                        </Text>
                                    </View>
                                </View>
                            )}
                            {service.status && (
                                <View style={styles.detailItem}>
                                    <View style={styles.detailIconContainer}>
                                        <IconSymbol name="checkmark.circle.fill" size={18} color={service.status === 'active' ? '#10B981' : '#6B7280'} />
                                    </View>
                                    <View style={styles.detailContent}>
                                        <Text style={styles.detailLabel}>Status</Text>
                                        <Text style={styles.detailValue}>
                                            {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                                        </Text>
                                    </View>
                                </View>
                            )}
                            {monthlyRate > 0 && (
                                <View style={styles.detailItem}>
                                    <View style={styles.detailIconContainer}>
                                        <IconSymbol name="dollarsign.circle.fill" size={18} color={Colors.light.primary} />
                                    </View>
                                    <View style={styles.detailContent}>
                                        <Text style={styles.detailLabel}>Monthly Rate</Text>
                                        <Text style={styles.detailValue}>₨{Math.floor(monthlyRate).toLocaleString()}/mo</Text>
                                    </View>
                                </View>
                            )}
                            {locations.length > 0 && (
                                <View style={styles.detailItem}>
                                    <View style={styles.detailIconContainer}>
                                        <IconSymbol name="location.fill" size={18} color={Colors.light.primary} />
                                    </View>
                                    <View style={styles.detailContent}>
                                        <Text style={styles.detailLabel}>Service Areas</Text>
                                        <Text style={styles.detailValue}>{locations.length} {locations.length === 1 ? 'location' : 'locations'}</Text>
                                    </View>
                                </View>
                            )}
                            {service.city && (
                                <View style={styles.detailItem}>
                                    <View style={styles.detailIconContainer}>
                                        <IconSymbol name="building.2.fill" size={18} color={Colors.light.primary} />
                                    </View>
                                    <View style={styles.detailContent}>
                                        <Text style={styles.detailLabel}>City</Text>
                                        <Text style={styles.detailValue}>{service.city}</Text>
                                    </View>
                                </View>
                            )}
                            {experience && (
                                <View style={styles.detailItem}>
                                    <View style={styles.detailIconContainer}>
                                        <IconSymbol name="star.fill" size={18} color={Colors.light.primary} />
                                    </View>
                                    <View style={styles.detailContent}>
                                        <Text style={styles.detailLabel}>Experience</Text>
                                        <Text style={styles.detailValue}>{experience} {experience === 1 ? 'year' : 'years'}</Text>
                                    </View>
                                </View>
                            )}
                            {verified && (
                                <View style={styles.detailItem}>
                                    <View style={styles.detailIconContainer}>
                                        <IconSymbol name="checkmark.seal.fill" size={18} color="#10B981" />
                                    </View>
                                    <View style={styles.detailContent}>
                                        <Text style={styles.detailLabel}>Verification</Text>
                                        <Text style={styles.detailValue}>Verified</Text>
                                    </View>
                                </View>
                            )}
                            {serviceTypes.length > 0 && (
                                <View style={styles.detailItem}>
                                    <View style={styles.detailIconContainer}>
                                        <IconSymbol name="list.bullet" size={18} color={Colors.light.primary} />
                                    </View>
                                    <View style={styles.detailContent}>
                                        <Text style={styles.detailLabel}>Service Types</Text>
                                        <Text style={styles.detailValue}>{serviceTypes.length} {serviceTypes.length === 1 ? 'type' : 'types'}</Text>
                                    </View>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Provider Card */}
                    <Text style={styles.sectionTitle}>Service Provider</Text>
                    <TouchableOpacity
                        style={styles.providerCard}
                        onPress={() => {
                            if (providerId) {
                                const profileType = providerRole === 'business' ? 'business' : 'helper';
                                router.push(`/profile/${profileType}/${providerId}`);
                            }
                        }}
                    >
                        <View style={styles.providerHeader}>
                            {providerImage ? (
                                <Image source={{ uri: providerImage }} style={styles.providerImage} />
                            ) : (
                                <View style={styles.providerPlaceholder}>
                                    <Text style={styles.providerInitial}>{providerName.charAt(0).toUpperCase()}</Text>
                                </View>
                            )}
                            <View style={styles.providerInfo}>
                                <View style={styles.providerNameRow}>
                                    <Text style={styles.providerName}>{providerName}</Text>
                                    {verified && (
                                        <View style={styles.verifiedBadge}>
                                            <IconSymbol name="checkmark.seal.fill" size={14} color="#10B981" />
                                        </View>
                                    )}
                                </View>
                                <View style={styles.providerMetaRow}>
                                    <View style={styles.ratingContainer}>
                                        <IconSymbol name="star.fill" size={14} color="#FFC107" />
                                        <Text style={styles.ratingText}>
                                            {provider?.rating ? Number(provider.rating).toFixed(1) : 'New'}
                                        </Text>
                                    </View>
                                    {provider?.reviews_count > 0 && (
                                        <>
                                            <Text style={styles.metaSeparator}>•</Text>
                                            <Text style={styles.reviewsText}>{provider.reviews_count} reviews</Text>
                                        </>
                                    )}
                                    {experience && (
                                        <>
                                            <Text style={styles.metaSeparator}>•</Text>
                                            <View style={styles.experienceBadge}>
                                                <IconSymbol name="clock.fill" size={12} color="#6366F1" />
                                                <Text style={styles.experienceText}>{experience}y</Text>
                                            </View>
                                        </>
                                    )}
                                </View>
                                {providerRole && (
                                    <View style={styles.roleBadgeContainer}>
                                        <View style={[styles.roleBadge, providerRole === 'business' && styles.roleBadgeBusiness]}>
                                            <Text style={styles.roleBadgeText}>
                                                {providerRole === 'business' ? 'Business' : 'Helper'}
                                            </Text>
                                        </View>
                                    </View>
                                )}
                            </View>
                            <IconSymbol name="chevron.right" size={20} color="#9CA3AF" />
                        </View>
                    </TouchableOpacity>

                    {/* Other Services */}
                    {otherServices.length > 0 && (
                        <View style={styles.otherServicesSection}>
                            <Text style={styles.sectionTitle}>More Services from {providerName}</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.otherServicesList}>
                                {otherServices.map((item, index) => {
                                    // Get service types for other services
                                    const otherServiceTypes = item.service_types && Array.isArray(item.service_types) && item.service_types.length > 0
                                        ? item.service_types
                                        : item.service_type
                                        ? [item.service_type]
                                        : ['Service'];
                                    
                                    const otherServiceName = otherServiceTypes.length === 1
                                        ? formatServiceType(otherServiceTypes[0])
                                        : `${formatServiceType(otherServiceTypes[0])} +${otherServiceTypes.length - 1}`;
                                    
                                    const otherServiceLocations: string[] = [];
                                    if (item.location_details && Array.isArray(item.location_details)) {
                                        item.location_details.forEach((loc: any) => {
                                            if (loc.display_text) {
                                                otherServiceLocations.push(loc.display_text);
                                            } else {
                                                const area = loc.area || loc.area_name;
                                                const city = loc.city_name || loc.city;
                                                if (area) otherServiceLocations.push(area);
                                                else if (city) otherServiceLocations.push(city);
                                            }
                                        });
                                    } else if (item.area) {
                                        otherServiceLocations.push(item.area);
                                    }
                                    
                                    const otherMonthlyRate = parseFloat(item.monthly_rate || '0');
                                    
                                    return (
                                        <TouchableOpacity
                                            key={index}
                                            style={styles.otherServiceCard}
                                            onPress={() => router.push(`/service/${item.id}`)}
                                        >
                                            <View style={styles.otherServiceHeader}>
                                                <View style={styles.otherServiceIcon}>
                                                    <IconSymbol name="wrench.fill" size={20} color="#FFFFFF" />
                                                </View>
                                                <View style={styles.otherServiceInfo}>
                                                    <Text style={styles.otherServiceName} numberOfLines={1}>
                                                        {otherServiceName}
                                                    </Text>
                                                    {otherServiceLocations.length > 0 && (
                                                        <View style={styles.otherServiceLocation}>
                                                            <IconSymbol name="mappin.circle.fill" size={12} color="rgba(255,255,255,0.8)" />
                                                            <Text style={styles.otherServiceLocationText} numberOfLines={1}>
                                                                {otherServiceLocations[0]}
                                                                {otherServiceLocations.length > 1 && ` +${otherServiceLocations.length - 1}`}
                                                            </Text>
                                                        </View>
                                                    )}
                                                </View>
                                            </View>
                                            {item.description && (
                                                <Text style={styles.otherServiceDescription} numberOfLines={2}>
                                                    {item.description}
                                                </Text>
                                            )}
                                            <View style={styles.otherServiceFooter}>
                                                {otherMonthlyRate > 0 ? (
                                                    <Text style={styles.otherServicePrice}>
                                                        ₨{Math.floor(otherMonthlyRate).toLocaleString()}
                                                        <Text style={styles.otherServicePricePeriod}>/mo</Text>
                                                    </Text>
                                                ) : (
                                                    <Text style={styles.otherServicePrice}>Contact for pricing</Text>
                                                )}
                                                <IconSymbol name="chevron.right" size={16} color="rgba(255,255,255,0.8)" />
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>
                    )}
                </View>

                {/* Bottom Padding for Action Bar */}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Bottom Action Bar */}
            <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
                <View style={styles.bottomActions}>
                    <TouchableOpacity
                        style={[styles.actionBtn, styles.callBtn]}
                        onPress={() => handleCall(phoneNumber)}
                    >
                        <IconSymbol name="phone.fill" size={24} color="#1F2937" />
                        <Text style={[styles.actionBtnText, { color: '#1F2937' }]}>Call</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionBtn, styles.whatsappBtn]}
                        onPress={() => handleWhatsApp(phoneNumber)}
                    >
                        <FontAwesome name="whatsapp" size={24} color="#FFFFFF" />
                        <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>WhatsApp</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionBtn, styles.messageBtn]}
                        onPress={() => router.push(`/chat/${providerId}`)}
                    >
                        <IconSymbol name="message.fill" size={24} color="#FFFFFF" />
                        <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>Message</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
    },
    scrollView: {
        flex: 1,
    },
    headerBackground: {
        backgroundColor: Colors.light.primary,
        height: 180,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 0,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        zIndex: 1,
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    contentContainer: {
        padding: 20,
        paddingTop: 100, // Push content down to overlap header
    },
    serviceCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    serviceHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 16,
        marginBottom: 24,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: '#EEF2FF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    serviceTitleContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    serviceTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1F2937',
        marginBottom: 8,
    },
    servicePrice: {
        fontSize: 26,
        fontWeight: '800',
        color: '#10B981',
    },
    servicePricePeriod: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginBottom: 20,
    },
    section: {
        marginBottom: 24,
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#374151',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    description: {
        fontSize: 15,
        color: '#6B7280',
        lineHeight: 24,
    },
    metaContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 20,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#F9FAFB',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    metaText: {
        fontSize: 14,
        color: '#4B5563',
        fontWeight: '600',
    },
    locationsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        alignItems: 'center',
    },
    locationTag: {
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E0E7FF',
    },
    locationTagText: {
        fontSize: 13,
        color: Colors.light.primary,
        fontWeight: '600',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1F2937',
        marginBottom: 16,
    },
    providerCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        marginBottom: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    providerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    providerImage: {
        width: 56,
        height: 56,
        borderRadius: 28,
    },
    providerPlaceholder: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#EEF2FF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    providerInitial: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.light.primary,
    },
    providerInfo: {
        flex: 1,
    },
    providerNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6,
    },
    providerName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    verifiedBadge: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#D1FAE5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    providerMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingText: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '600',
    },
    metaSeparator: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    reviewsText: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500',
    },
    experienceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    experienceText: {
        fontSize: 12,
        color: '#6366F1',
        fontWeight: '600',
    },
    roleBadgeContainer: {
        marginTop: 4,
    },
    roleBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    roleBadgeBusiness: {
        backgroundColor: '#FEF3C7',
    },
    roleBadgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#6366F1',
    },
    detailsCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    detailsTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 16,
    },
    detailsGrid: {
        gap: 16,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    detailIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#EEF2FF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    detailContent: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    detailValue: {
        fontSize: 15,
        color: '#1F2937',
        fontWeight: '600',
    },
    otherServicesSection: {
        marginBottom: 24,
    },
    otherServicesList: {
        paddingRight: 20,
        gap: 16,
    },
    otherServiceCard: {
        backgroundColor: Colors.light.primary,
        padding: 16,
        borderRadius: 20,
        width: 240,
        shadowColor: Colors.light.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    otherServiceHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 12,
    },
    otherServiceIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    otherServiceInfo: {
        flex: 1,
    },
    otherServiceName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 6,
    },
    otherServiceLocation: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    otherServiceLocationText: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '500',
    },
    otherServiceDescription: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.9)',
        lineHeight: 18,
        marginBottom: 12,
    },
    otherServiceFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    otherServicePrice: {
        fontSize: 18,
        color: '#FFFFFF',
        fontWeight: '700',
    },
    otherServicePricePeriod: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '500',
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    bottomActions: {
        flexDirection: 'row',
        gap: 12,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 16,
        gap: 4,
        height: 72,
    },
    callBtn: {
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    whatsappBtn: {
        backgroundColor: '#25D366',
    },
    messageBtn: {
        backgroundColor: Colors.light.primary,
    },
    actionBtnText: {
        fontSize: 12,
        fontWeight: '600',
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    serviceTag: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    serviceTagText: {
        fontSize: 13,
        color: '#4B5563',
        fontWeight: '500',
    },
    noDataText: {
        fontSize: 13,
        color: '#9CA3AF',
        fontStyle: 'italic',
    },
});
