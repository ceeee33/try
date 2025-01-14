import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const DonationForm = ({ category, onClose, onSubmitSuccess }) => {
    console.log('Initial localStorage values:', {
        userName: localStorage.getItem('userName'),
        userEmail: localStorage.getItem('userEmail'),
        userPhone: localStorage.getItem('userPhone'),
        userId: localStorage.getItem('userId')
    });

    const [formData, setFormData] = useState({
        name: localStorage.getItem('userName') || '',
        email: localStorage.getItem('userEmail') || '',
        phone: localStorage.getItem('userPhone') || '',
        itemType: '',
        numberOfItems: '',
        expiryDate: '',
        school: '',
        description: '',
        pickupNeeded: false,
        dropoffLocation: '',
        preferredDate: '',
        preferredTime: ''
    });

    const [loading, setLoading] = useState(false);

    const itemOptions = {
        Food: ['Biscuit', 'Bread', 'Canned Goods', 'Coffee Powder', 'Cup Noodles', 'Snacks'],
        'School Supplies': ['Reference Books', 'Textbooks', 'Stationery', 'Eraser', 'Ruler'],
        'Household Essentials': ['Broom', 'Hanger', 'Cloth'],
        'Personal Care Products': ['Toothpaste', 'Toilet Paper', 'Sanitary Products', 'Towel'],
    };

    const schools = [
        'School of Computer Science',
        'School of Management',
        'School of Biology'
    ];

    const dropoffLocations = [
        'Main Campus Reception',
        'Student Center',
        'Library'
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const donationData = {
                ...formData,
                category: category.name,
                donorId: localStorage.getItem('userId'),
                status: 'Pending',
                createdAt: serverTimestamp(),
                numberOfItems: parseInt(formData.numberOfItems) || 0
            };

            console.log('Submitting donation data:', donationData);
            const docRef = await addDoc(collection(db, 'donations'), donationData);
            console.log('Donation submitted with ID:', docRef.id);

            setTimeout(() => {
                onSubmitSuccess();
            }, 1500);
        } catch (error) {
            console.error("Error submitting donation:", error);
            alert('Failed to submit donation. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    useEffect(() => {
        console.log('localStorage values:', {
            userId: localStorage.getItem('userId'),
            userName: localStorage.getItem('userName'),
            userEmail: localStorage.getItem('userEmail'),
            userPhone: localStorage.getItem('userPhone')
        });
    }, []);

    useEffect(() => {
        const phoneNumber = localStorage.getItem('userPhone');
        console.log('Phone number from localStorage:', phoneNumber);
        if (!phoneNumber) {
            console.log('No phone number found in localStorage');
        }
    }, []);

    useEffect(() => {
        console.log('Form Data:', formData);
        console.log('LocalStorage:', {
            userName: localStorage.getItem('userName'),
            userEmail: localStorage.getItem('userEmail'),
            userPhone: localStorage.getItem('userPhone')
        });
    }, [formData]);

    useEffect(() => {
        console.log('Current formData:', formData);
        if (!formData.name || !formData.email || !formData.phone) {
            console.warn('Missing user data:', {
                name: !formData.name,
                email: !formData.email,
                phone: !formData.phone
            });
        }
    }, [formData]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold">{category.name} Donation Form</h2>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                            ✕
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* Personal Information */}
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        readOnly
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        readOnly
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        readOnly
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Donation Details */}
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-4">Donation Details</h3>
                            {category.name !== 'Others' && (
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700">Item Type</label>
                                    <select
                                        name="itemType"
                                        value={formData.itemType}
                                        onChange={handleChange}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                        required
                                    >
                                        <option value="">Select an item</option>
                                        {itemOptions[category.name]?.map(item => (
                                            <option key={item} value={item}>{item}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {category.name === 'Food' && (
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
                                    <input
                                        type="date"
                                        name="expiryDate"
                                        value={formData.expiryDate}
                                        onChange={handleChange}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                        required
                                    />
                                </div>
                            )}

                            {category.name === 'School Supplies' && (
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700">School</label>
                                    <select
                                        name="school"
                                        value={formData.school}
                                        onChange={handleChange}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                        required
                                    >
                                        <option value="">Select a school</option>
                                        {schools.map(school => (
                                            <option key={school} value={school}>{school}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {category.name === 'Others' && (
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700">Description</label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                        rows="3"
                                        required
                                    />
                                </div>
                            )}

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Number of Items</label>
                                <input
                                    type="number"
                                    name="numberOfItems"
                                    value={formData.numberOfItems}
                                    onChange={handleChange}
                                    min="1"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                    required
                                />
                            </div>
                        </div>

                        {/* Delivery Method */}
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-4">Delivery Method</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            name="pickupNeeded"
                                            checked={formData.pickupNeeded}
                                            onChange={handleChange}
                                            className="rounded border-gray-300 text-blue-600 shadow-sm"
                                        />
                                        <span className="ml-2">Pickup Needed</span>
                                    </label>
                                </div>

                                {!formData.pickupNeeded && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Drop-off Location</label>
                                        <select
                                            name="dropoffLocation"
                                            value={formData.dropoffLocation}
                                            onChange={handleChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                            required
                                        >
                                            <option value="">Select a location</option>
                                            {dropoffLocations.map(location => (
                                                <option key={location} value={location}>{location}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Preferred Date</label>
                                        <input
                                            type="date"
                                            name="preferredDate"
                                            value={formData.preferredDate}
                                            onChange={handleChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Preferred Time</label>
                                        <input
                                            type="time"
                                            name="preferredTime"
                                            value={formData.preferredTime}
                                            onChange={handleChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                            >
                                {loading ? 'Submitting...' : 'Submit Donation'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default DonationForm; 
//testing to merge see if it works