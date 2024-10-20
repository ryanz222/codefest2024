import React from 'react';

interface FeatureBoxProps {
    title: string;
    description: string;
    theme?: string;
}

const FeatureBox: React.FC<FeatureBoxProps> = ({ title, description, theme }) => {
    const isDarkMode = theme === 'dark';

    return (
        <div className={`p-6 rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                {title}
            </h3>
            <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                {description}
            </p>
        </div>
    );
};

export default FeatureBox;