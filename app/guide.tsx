import { useAuth } from '@/contexts/AuthContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    Dimensions,
    FlatList,
    Image,
    NativeScrollEvent,
    NativeSyntheticEvent,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const slides = [
    {
        id: '1',
        image: require('@/assets/images/guide/guide_1.png'),
        title: 'Welcome to Kamwaalay',
        description: 'Find trusted professionals for your home, from expert cooks to reliable caregivers.',
    },
    {
        id: '2',
        image: require('@/assets/images/guide/guide_2.png'),
        title: 'Find Helpers',
        description: 'Browse through thousands of verified profiles to find the perfect help for your home.',
    },
    {
        id: '3',
        image: require('@/assets/images/guide/guide_3.png'),
        title: 'Post a Job',
        description: 'Post your requirements and let qualified professionals reach out to you directly.',
    },
    {
        id: '4',
        image: require('@/assets/images/guide/guide_4.png'),
        title: 'Ready to start?',
        description: 'Connect with thousands of verified helpers in your city with trust and security.',
        isLast: true,
    },
];

const CUSTOMER_SLIDES = slides; // Existing slides are for customers

const WORKER_SLIDES = [
    {
        id: '1',
        image: require('@/assets/images/guide/guide_helper_1.png'),
        title: 'Your journey to better work starts here',
        description: 'Connect with local customers and grow your professional service business with Kamwaalay.',
    },
    {
        id: '2',
        image: require('@/assets/images/guide/guide_helper_2.png'),
        title: 'Find Work Near You',
        description: 'See available jobs in your local neighborhood. Filter by service type and distance to find the perfect match.',
    },
    {
        id: '3',
        image: require('@/assets/images/guide/guide_helper_3.png'),
        title: 'Apply in One Tap',
        description: 'No long forms. Send your profile to employers instantly and get hired faster than ever.',
    },
    {
        id: '4',
        image: require('@/assets/images/guide/guide_helper_4.png'),
        title: 'Start Earning Today',
        description: 'Your profile is almost ready. Get verified, connect directly with employers via chat, and start taking jobs in your area immediately.',
        isLast: true,
    },
];

const BUSINESS_SLIDES = [
    {
        id: '1',
        image: require('@/assets/images/guide/guide_business_1.png'),
        title: 'Manage Your Business',
        description: 'Effortlessly hire skilled workers, manage your team, and track bookings all in one powerful dashboard.',
    },
    {
        id: '2',
        image: require('@/assets/images/guide/guide_business_2.png'),
        title: 'Add Your Team',
        description: 'Scale your business by adding your specialized workers. Manage registrations for cleaners, cooks, and other staff members in one central dashboard.',
    },
    {
        id: '3',
        image: require('@/assets/images/guide/guide_business_3.png'),
        title: 'Track Applications',
        description: 'Real-time updates on every applicant. Shortlist, interview, and hire with ease.',
    },
    {
        id: '4',
        image: require('@/assets/images/guide/guide_business_4.png'),
        title: 'Grow Your Business',
        description: 'Everything you need to hire and manage professionals effectively.',
        isLast: true,
    },
];

const INTRO_SLIDES = [
    {
        id: '1',
        image: require('@/assets/images/guide/guide_intro_1.png'),
        title: 'Welcome to Kamwaalay',
        description: "The one-stop shop for all household services. Whether you're here to work, grow your business, or find help for your home.",
    },
    {
        id: '2',
        image: require('@/assets/images/guide/guide_intro_2.png'),
        title: 'Find Work or Manage Teams',
        description: "Whether you're looking for your next gig or scaling your business, Kamwaalay connects you to the right opportunities and the best talent in one unified platform.",
    },
    {
        id: '3',
        image: require('@/assets/images/guide/guide_intro_3.png'),
        title: 'Hire with Confidence',
        description: "Access a network of background-verified professionals. Whether it's a cook, maid, or office helper, experience secure and seamless hiring at your fingertips.",
    },
    {
        id: '4',
        image: require('@/assets/images/guide/guide_intro_4.png'),
        title: 'Ready to join Kamwaalay?',
        description: "Choose your path and start connecting. Whether you're here to work, hire, or grow your business, we've got you covered.",
        isLast: true,
    },
];


export default function GuideScreen() {
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const router = useRouter();
    const { user, completeGuide } = useAuth();
    const insets = useSafeAreaInsets();

    const isWorker = user?.userType?.toLowerCase() === 'helper';
    const isBusiness = user?.userType?.toLowerCase() === 'business';
    const isGuest = !user;
    const activeSlides = isGuest ? INTRO_SLIDES : isWorker ? WORKER_SLIDES : isBusiness ? BUSINESS_SLIDES : CUSTOMER_SLIDES;

    const backgroundColor = useThemeColor({}, 'background');
    const textColor = useThemeColor({}, 'text');
    const textSecondary = useThemeColor({}, 'textSecondary');
    const primaryColor = useThemeColor({}, 'primary');

    const updateCurrentSlideIndex = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const contentOffsetX = e.nativeEvent.contentOffset.x;
        const currentIndex = Math.round(contentOffsetX / width);
        setCurrentSlideIndex(currentIndex);
    };

    const handleNext = () => {
        const nextIndex = currentSlideIndex + 1;
        if (nextIndex < activeSlides.length) {
            flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
            setCurrentSlideIndex(nextIndex);
        } else {
            handleComplete();
        }
    };

    const handleComplete = async () => {
        await completeGuide();
        if (!user) {
            router.replace('/auth/signup');
            return;
        }
        if (isWorker) {
            if (user?.onboardingStatus === 'completed') {
                router.replace('/onboarding/helper-profile');
            } else {
                router.replace('/onboarding/start');
            }
        } else if (isBusiness) {
            router.replace('/onboarding/business-profile');
        } else {
            router.replace('/(tabs)');
        }
    };

    const renderSlide = ({ item }: { item: typeof activeSlides[0] }) => {
        return (
            <View style={[styles.slide, { width }]}>
                <Image
                    source={item.image}
                    style={styles.image}
                    resizeMode="contain"
                />
                <View style={styles.textContainer}>
                    <Text style={[styles.title, { color: textColor }]}>{item.title}</Text>
                    <Text style={[styles.description, { color: textSecondary }]}>
                        {item.description}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor, paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={handleComplete}>
                    <Text style={[styles.skipText, { color: textSecondary }]}>Skip</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                ref={flatListRef}
                onMomentumScrollEnd={updateCurrentSlideIndex}
                data={activeSlides}
                contentContainerStyle={{ height: height * 0.75 }}
                horizontal
                showsHorizontalScrollIndicator={false}
                pagingEnabled
                renderItem={renderSlide}
                keyExtractor={(item) => item.id}
            />

            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 40) }]}>
                <View style={styles.indicatorContainer}>
                    {activeSlides.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.indicator,
                                { backgroundColor: index === currentSlideIndex ? primaryColor : '#E5E7EB' },
                                index === currentSlideIndex && { width: 24, borderRadius: 4 },
                            ]}
                        />
                    ))}
                </View>

                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleNext}
                    style={[styles.btn, { backgroundColor: primaryColor }]}
                >
                    <Text style={styles.btnText}>
                        {currentSlideIndex === activeSlides.length - 1
                            ? (isGuest ? 'Start Onboarding' : isWorker || isBusiness ? 'Start Onboarding' : 'Get Started')
                            : 'Next'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 20,
        alignItems: 'flex-end',
    },
    skipText: {
        fontSize: 16,
        fontWeight: '600',
    },
    slide: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    image: {
        width: '100%',
        height: '100%',
        flex: 1,
    },
    textContainer: {
        paddingHorizontal: 40,
        paddingBottom: 40,
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 10,
    },
    description: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
    },
    footer: {
        paddingHorizontal: 20,
    },
    indicatorContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 30,
        gap: 8,
    },
    indicator: {
        height: 8,
        width: 8,
        borderRadius: 4,
    },
    btn: {
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    btnText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '700',
    },
});
