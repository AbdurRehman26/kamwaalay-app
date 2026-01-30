import { ScreenHeader } from '@/components/ScreenHeader';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColor } from '@/hooks/use-theme-color';

import { API_ENDPOINTS } from '@/constants/api';
import { apiService } from '@/services/api';
import { toast } from '@/utils/toast'; // Added import
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';





const WORK_TYPES = [
  { id: 'full_time', label: 'Full Time' },
  { id: 'part_time', label: 'Part Time' },
];

export default function CreateRequestScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addJob } = useApp();
  const { user } = useAuth();

  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const textMuted = useThemeColor({}, 'textMuted');
  const cardBg = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const primaryColor = useThemeColor({}, 'primary');
  const errorColor = '#FF3B30';

  // Form State
  const [serviceTypes, setServiceTypes] = useState<{ id: number, name: string }[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [serviceType, setServiceType] = useState<number | null>(null);
  const [workType, setWorkType] = useState<string>('');
  const [estimatedSalary, setEstimatedSalary] = useState('');
  const [userName, setUserName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phoneNumber || '');

  useEffect(() => {
    if (user) {
      setUserName(user.name || '');
      setPhone(user.phoneNumber || '');
    }
  }, [user]);

  const [specialRequirements, setSpecialRequirements] = useState('');

  useEffect(() => {
    fetchServiceTypes();
  }, []);

  const fetchServiceTypes = async () => {
    try {
      setIsLoadingServices(true);
      const response = await apiService.get(API_ENDPOINTS.SERVICE_TYPES.LIST);
      if (response.data) {
        // Handle various response structures
        const data = Array.isArray(response.data) ? response.data : response.data.data;
        if (Array.isArray(data)) {
          const types = data.map((item: any) => ({
            id: item.id,
            name: item.name || item.slug || item.label || ''
          })).filter((t) => t.id && t.name);
          setServiceTypes(types);
        }
      }
    } catch (error) {
    } finally {
      setIsLoadingServices(false);
    }
  };

  // Modal State
  const [activeSelection, setActiveSelection] = useState<'service' | 'work' | null>(null);

  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);


  const handleCreate = async () => {
    let errorMsg = '';
    if (!serviceType) errorMsg = 'Please select a service type';
    else if (!workType) errorMsg = 'Please select a work type';
    else if (!userName.trim()) errorMsg = 'Please enter your name';
    else if (!phone.trim()) errorMsg = 'Please enter your phone number';

    if (errorMsg) {
      toast.error(errorMsg);
      return;
    }

    setIsSubmitting(true);
    try {
      if (serviceType === null) throw new Error('Service type not selected');
      await addJob({
        userId: user?.id || 'guest',
        userName: userName,
        serviceName: serviceType.toString(), // Passing ID as string for now to match interface
        description: specialRequirements,
        location: (user as any)?.pin_address || '',
        latitude: (user as any)?.pin_latitude,
        longitude: (user as any)?.pin_longitude,
        address: (user as any)?.pin_address || '',
        budget: estimatedSalary ? parseFloat(estimatedSalary) : undefined,
        workType,
        phone,
      });

      toast.success('Job created successfully');
      router.replace('/(tabs)/job-posts');
    } catch (error) {
      toast.error('Failed to create job');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSelectionModal = () => {
    if (!activeSelection) return null;

    let title = '';
    let options: any[] = [];
    let onSelect: (item: any) => void = () => { };

    if (activeSelection === 'service') {
      title = 'Select Service Type';
      options = serviceTypes;
      onSelect = (item) => {
        setServiceType(item.id);
        setActiveSelection(null);
      };
    } else if (activeSelection === 'work') {
      title = 'Select Work Type';
      options = WORK_TYPES;
      onSelect = (item) => {
        setWorkType(item.id);
        setActiveSelection(null);
      };
    }


    return (
      <Modal
        visible={!!activeSelection}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setActiveSelection(null)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: backgroundColor }}>
          <View style={[styles.modalHeader, { borderBottomColor: borderColor }]}>
            <TouchableOpacity onPress={() => setActiveSelection(null)} style={styles.closeButton}>
              <IconSymbol name="xmark" size={24} color={textColor} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: textColor }]}>{title}</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView contentContainerStyle={{ padding: 20 }}>
            {options.map((item: any, index: number) => {
              const label = activeSelection === 'service' ? item.name : item.label;
              const value = item.id;
              const isSelected = (activeSelection === 'service' && serviceType === value) ||
                (activeSelection === 'work' && workType === value);

              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.modalItem, { borderBottomColor: borderColor }]}
                  onPress={() => onSelect(item)}
                >
                  <Text style={[styles.modalItemText, { color: textColor }]}>
                    {label}
                  </Text>
                  {isSelected && (
                    <IconSymbol name="checkmark" size={20} color={primaryColor} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };

  const renderMapModal = () => null;

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <ScreenHeader title="Post a Job" />

          <View style={styles.form}>
            {/* ... rest of the form ... */}
            {/* Row 1: Service Type & Work Type */}
            <View style={styles.row}>
              <View style={styles.col}>
                <ThemedText style={styles.label}>SERVICE TYPE *</ThemedText>
                <TouchableOpacity
                  style={[styles.dropdownButton, { backgroundColor: cardBg, borderColor: borderColor }]}
                  onPress={() => setActiveSelection('service')}
                >
                  <Text style={[styles.dropdownButtonText, { color: serviceType ? textColor : textMuted }]}>
                    {serviceType ? serviceTypes.find(s => s.id === serviceType)?.name : 'Select Service'}
                  </Text>
                  <IconSymbol name="chevron.down" size={16} color={textMuted} />
                </TouchableOpacity>
              </View>

              <View style={styles.col}>
                <ThemedText style={styles.label}>WORK TYPE *</ThemedText>
                <TouchableOpacity
                  style={[styles.dropdownButton, { backgroundColor: cardBg, borderColor: borderColor }]}
                  onPress={() => setActiveSelection('work')}
                >
                  <Text style={[styles.dropdownButtonText, { color: workType ? textColor : textMuted }]}>
                    {workType ? WORK_TYPES.find(w => w.id === workType)?.label : 'Select Type'}
                  </Text>
                  <IconSymbol name="chevron.down" size={16} color={textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Row 2: Salary & Area */}
            <View style={styles.row}>
              <View style={styles.col}>
                <ThemedText style={styles.label}>ESTIMATED SALARY</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: cardBg, borderColor: borderColor, color: textColor }]}
                  placeholder="25000"
                  placeholderTextColor={textMuted}
                  keyboardType="numeric"
                  value={estimatedSalary}
                  onChangeText={setEstimatedSalary}
                />
              </View>
            </View>

            {/* Row 3: Name & Phone */}
            <View style={styles.row}>
              <View style={styles.col}>
                <ThemedText style={styles.label}>YOUR NAME *</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: cardBg, borderColor: borderColor, color: textMuted, opacity: 0.8 }]}
                  placeholder="Full Name"
                  placeholderTextColor={textMuted}
                  value={userName}
                  editable={false}
                />
              </View>

              <View style={styles.col}>
                <ThemedText style={styles.label}>PHONE *</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: cardBg, borderColor: borderColor, color: textMuted, opacity: 0.8 }]}
                  placeholder="03001234567"
                  placeholderTextColor={textMuted}
                  keyboardType="phone-pad"
                  value={phone}
                  editable={false}
                />
                <View style={styles.helperTextContainer}>
                  <IconSymbol name="info.circle" size={12} color={textMuted} />
                  <Text style={[styles.helperText, { color: textMuted }]}>
                    Not visible until you accept an application.
                  </Text>
                </View>
              </View>
            </View>

            {/* Special Requirements */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>SPECIAL REQUIREMENTS</ThemedText>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: cardBg, borderColor: borderColor, color: textColor }]}
                placeholder="Any special requirements or preferences..."
                placeholderTextColor={textMuted}
                multiline
                numberOfLines={4}
                value={specialRequirements}
                onChangeText={setSpecialRequirements}
              />
            </View>

            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: primaryColor }, isSubmitting && { opacity: 0.7 }]}
                onPress={handleCreate}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Submit Job Post</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryButton, { backgroundColor: cardBg, borderColor: borderColor }]}
                onPress={() => router.push('/(tabs)/helpers')}
              >
                <Text style={[styles.secondaryButtonText, { color: textColor }]}>Browse Helpers First</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {renderSelectionModal()}
      {renderMapModal()}

    </ThemedView >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },

  form: {
    paddingHorizontal: 20,
    paddingBottom: 60,
    marginTop: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  col: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    // Removed uppercase and letterspacing to match edit profile
  },
  input: {
    borderWidth: 1,
    borderRadius: 16, // Changed from 8 to 16
    padding: 16, // Changed from 12 to 16
    fontSize: 16, // Changed from 14 to 16
    height: 56, // Changed from 48 to 56
  },
  textArea: {
    height: 'auto',
    minHeight: 100, // Increased slightly
    textAlignVertical: 'top',
    paddingTop: 16,
  },
  dropdownButton: {
    borderWidth: 1,
    borderRadius: 16, // Changed from 8 to 16
    padding: 16, // Changed from 12 to 16
    height: 56, // Changed from 48 to 56
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownButtonText: {
    fontSize: 16, // Changed from 14 to 16
  },
  loader: {
    position: 'absolute',
    right: 16,
    top: 18,
  },
  helperTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  helperText: {
    fontSize: 12, // Increased from 11
  },
  footer: {
    flexDirection: 'column',
    gap: 12,
    marginTop: 24,
  },
  submitButton: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryButton: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    width: '100%',
  },
  secondaryButtonText: {
    fontWeight: '700',
    fontSize: 16, // Changed from 14 to 16
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalItemText: {
    fontSize: 16,
  },
});
