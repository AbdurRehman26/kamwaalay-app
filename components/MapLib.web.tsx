import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

// Web fallback for MapView
const MapView = (props: any) => {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Google Maps is not supported on web.</Text>
            <Text style={styles.subtext}>Please use the mobile app for location features.</Text>
        </View>
    );
};

// Mock components and constants
export const Marker = (props: any) => null;
export const PROVIDER_GOOGLE = 'google';

// Mock types
export type Region = {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
};
export type MapPressEvent = any;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f0f0',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 200,
    },
    text: {
        fontWeight: 'bold',
        color: '#666',
    },
    subtext: {
        color: '#999',
        marginTop: 4,
    }
});

export default MapView;
