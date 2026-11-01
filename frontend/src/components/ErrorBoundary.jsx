import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught error captured by ErrorBoundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-leaf-50 flex items-center justify-center p-4 text-center font-sans">
          <div className="w-full max-w-sm bg-white border border-gray-200 rounded-3xl p-6 shadow-md space-y-4">
            <div className="w-16 h-16 mx-auto bg-amber-100 text-amber-800 rounded-2xl flex items-center justify-center text-3xl shadow-xs">
              🌾
            </div>
            <h1 className="text-xl font-bold text-gray-900 leading-snug">
              দুঃখিত, একটি সমস্যা দেখা দিয়েছে
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              আপনার আপলোড করা ছবি আপনার ফোনেই সুরক্ষিত রয়েছে। অনুগ্রহ করে আবার শুরু করুন।
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full py-3.5 px-4 bg-leaf-700 hover:bg-leaf-800 active:scale-[0.98] text-white font-bold rounded-2xl shadow-sm text-sm sm:text-base cursor-pointer focus:outline-none focus:ring-4 focus:ring-leaf-300"
              >
                ↺ আবার শুরু করুন
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
