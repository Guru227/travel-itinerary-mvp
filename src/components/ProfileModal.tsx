import React, { useState } from 'react';
import { X, User, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { User as UserType } from '../types';

interface ProfileModalProps {
  isOpen: boolean;
  user: UserType;
  onClose: () => void;
  onUpdate: (user: UserType) => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, user, onClose, onUpdate }) => {
  const [nickname, setNickname] = useState(user.nickname || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { data, error } = await supabase
        .from('users')
        .update({ nickname: nickname.trim() || null })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      onUpdate(data);
    } catch (err) {
      setError('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            <h2 className="font-poppins font-bold text-xl text-secondary">
              Profile Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block font-lato font-semibold text-secondary mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={user.email}
              disabled
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 font-lato text-gray-500"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="nickname" className="block font-lato font-semibold text-secondary mb-2">
              Display Name (Nickname)
            </label>
            <input
              type="text"
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Enter your display name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary font-lato"
              maxLength={50}
            />
            <p className="text-xs text-gray-500 font-lato mt-1">
              This will be shown on your shared itineraries. Leave blank to use your email username.
            </p>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 font-lato text-sm">{error}</p>
            </div>
          )}
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg transition-colors font-poppins font-semibold hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-primary hover:bg-primary/90 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-poppins font-semibold flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileModal;