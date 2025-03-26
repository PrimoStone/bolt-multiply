import React, { useState } from 'react';
import { 
  AvatarItem, 
  UserAvatarItem, 
  AvatarItemType, 
  AvatarLevel,
  EquippedItems 
} from '../../types/rewardTypes';
import { useUser } from '../../contexts/UserContext';
import { useRewards } from '../../contexts/RewardContext';

/**
 * Props for the AvatarCustomizer component
 */
interface AvatarCustomizerProps {
  avatarItems: AvatarItem[];       // All available avatar items
  userAvatarItems: UserAvatarItem[]; // Items owned by the user
  equippedItems: EquippedItems;    // Currently equipped items
  avatarLevel: AvatarLevel;        // User's current avatar level
  coins: number;                   // User's current coin balance
  onPurchase?: (success: boolean) => void; // Optional callback after purchase attempt
  onEquip?: () => void;            // Optional callback after equipping an item
}

/**
 * Component for customizing user's avatar with unlocked/purchased items
 * Allows users to purchase new items and equip owned items
 */
const AvatarCustomizer: React.FC<AvatarCustomizerProps> = ({
  avatarItems,
  userAvatarItems,
  equippedItems,
  avatarLevel,
  coins,
  onPurchase,
  onEquip
}) => {
  // Create a map of avatarItemIds that the user owns for quick lookup
  const ownedItemIds = new Set(userAvatarItems.map(ui => ui.avatarItemId));
  
  // Get the equipped items by type
  const getEquippedItemId = (type: AvatarItemType): string | undefined => {
    return equippedItems[type];
  };
  
  // State for managing tab selection
  const [selectedTab, setSelectedTab] = useState<AvatarItemType>('headband');
  
  // State for the preview item (when hovering)
  const [previewItemId, setPreviewItemId] = useState<string | null>(null);
  
  // Access the reward context for purchasing and equipping
  const { purchaseAvatarItem, equipAvatarItem } = useRewards();
  
  // Filter items by selected type
  const filteredItems = avatarItems.filter(item => item.type === selectedTab);
  
  // Handle item purchase
  const handlePurchase = async (item: AvatarItem) => {
    // Check if user already owns the item
    if (ownedItemIds.has(item.id)) {
      console.log('You already own this item');
      return;
    }
    
    // Check if user has enough coins
    if (coins < item.cost) {
      console.log('Not enough coins to purchase this item');
      onPurchase && onPurchase(false);
      return;
    }
    
    // Attempt to purchase the item
    const success = await purchaseAvatarItem(item.id);
    console.log(success ? 'Purchase successful' : 'Purchase failed');
    onPurchase && onPurchase(success);
  };
  
  // Handle item equip
  const handleEquip = async (item: AvatarItem) => {
    // Check if user owns the item
    if (!ownedItemIds.has(item.id)) {
      console.log('You don\'t own this item');
      return;
    }
    
    // Attempt to equip the item
    const success = await equipAvatarItem(item.id, item.type);
    console.log(success ? 'Item equipped' : 'Failed to equip item');
    onEquip && onEquip();
  };
  
  // Helper function to get avatar image based on level
  const getAvatarBaseImage = (level: AvatarLevel): string => {
    // Replace with actual avatar base images
    return `/assets/avatar-levels/${level}.png`;
  };
  
  // Helper to get item image for the selected slot
  const getItemImage = (type: AvatarItemType): string | undefined => {
    const equippedId = getEquippedItemId(type);
    const previewId = previewItemId;
    
    // If previewing an item, show that instead
    const targetId = previewId || equippedId;
    
    if (!targetId) return undefined;
    
    const item = avatarItems.find(item => item.id === targetId && item.type === type);
    return item?.imageUrl;
  };
  
  // Tab labels
  const tabLabels: Record<AvatarItemType, string> = {
    headband: 'Headbands',
    outfit: 'Outfits',
    accessory: 'Accessories',
    background: 'Backgrounds'
  };
  
  return (
    <div className="w-full bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <h2 className="text-2xl font-bold">Avatar Customizer</h2>
        <p className="text-sm opacity-80">Customize your character with items you've earned and purchased</p>
      </div>
      
      <div className="flex flex-col md:flex-row">
        {/* Avatar preview section */}
        <div className="w-full md:w-1/3 p-6 bg-gray-50 flex flex-col items-center">
          <div className="relative w-48 h-48 bg-gradient-to-b from-blue-100 to-white rounded-lg border-2 border-blue-200 shadow-md mb-4 overflow-hidden">
            {/* Base avatar */}
            <img 
              src={getAvatarBaseImage(avatarLevel)} 
              alt={`${avatarLevel} Avatar`}
              className="absolute inset-0 w-full h-full object-contain"
            />
            
            {/* Layer each equipped item on top */}
            {getItemImage('background') && (
              <img 
                src={getItemImage('background')} 
                alt="Background"
                className="absolute inset-0 w-full h-full object-cover z-0"
              />
            )}
            
            {getItemImage('outfit') && (
              <img 
                src={getItemImage('outfit')} 
                alt="Outfit"
                className="absolute inset-0 w-full h-full object-contain z-10"
              />
            )}
            
            {getItemImage('headband') && (
              <img 
                src={getItemImage('headband')} 
                alt="Headband"
                className="absolute inset-0 w-full h-full object-contain z-20"
              />
            )}
            
            {getItemImage('accessory') && (
              <img 
                src={getItemImage('accessory')} 
                alt="Accessory"
                className="absolute inset-0 w-full h-full object-contain z-30"
              />
            )}
          </div>
          
          {/* Avatar level indicator */}
          <div className="bg-white px-4 py-2 rounded-full shadow border border-gray-200 mb-4">
            <span className="font-bold capitalize">{avatarLevel} Ninja</span>
          </div>
          
          {/* Coin balance */}
          <div className="flex items-center bg-yellow-100 px-4 py-2 rounded-full shadow border border-yellow-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
            </svg>
            <span className="font-semibold">{coins} Coins</span>
          </div>
        </div>
        
        {/* Item selection section */}
        <div className="w-full md:w-2/3 p-4">
          {/* Type tabs */}
          <div className="flex border-b border-gray-200 mb-4">
            {Object.entries(tabLabels).map(([type, label]) => (
              <button
                key={type}
                className={`
                  px-4 py-2 font-medium text-sm focus:outline-none
                  ${selectedTab === type 
                    ? 'border-b-2 border-blue-500 text-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'}
                `}
                onClick={() => setSelectedTab(type as AvatarItemType)}
              >
                {label}
              </button>
            ))}
          </div>
          
          {/* Items grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto p-2">
            {filteredItems.map(item => {
              const isOwned = ownedItemIds.has(item.id);
              const isEquipped = getEquippedItemId(item.type) === item.id;
              const isLocked = !isOwned && item.unlockRequirement;
              
              return (
                <div 
                  key={item.id}
                  className={`
                    border rounded-lg overflow-hidden shadow-sm transition-all
                    ${isEquipped ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}
                    ${isLocked ? 'opacity-70' : ''}
                  `}
                  onMouseEnter={() => setPreviewItemId(item.id)}
                  onMouseLeave={() => setPreviewItemId(null)}
                >
                  <div className="p-2 h-24 flex items-center justify-center bg-gray-50 relative">
                    {/* Item image */}
                    {item.imageUrl ? (
                      <img 
                        src={item.imageUrl} 
                        alt={item.name}
                        className="max-h-20 max-w-full object-contain"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-gray-400">?</span>
                      </div>
                    )}
                    
                    {/* Equipped indicator */}
                    {isEquipped && (
                      <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                        Equipped
                      </div>
                    )}
                  </div>
                  
                  <div className="p-3 border-t border-gray-100">
                    <h3 className="font-semibold text-sm">{item.name}</h3>
                    <p className="text-xs text-gray-500 mb-2">{item.description}</p>
                    
                    {/* Action buttons */}
                    {isOwned ? (
                      <button
                        onClick={() => handleEquip(item)}
                        disabled={isEquipped}
                        className={`
                          w-full py-1 text-xs rounded font-medium
                          ${isEquipped 
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                            : 'bg-blue-500 text-white hover:bg-blue-600'}
                        `}
                      >
                        {isEquipped ? 'Equipped' : 'Equip'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePurchase(item)}
                        disabled={coins < item.cost || isLocked}
                        className={`
                          w-full py-1 text-xs rounded font-medium flex items-center justify-center
                          ${coins < item.cost || isLocked
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                            : 'bg-green-500 text-white hover:bg-green-600'}
                        `}
                      >
                        {isLocked ? (
                          <span>Locked</span>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                            </svg>
                            <span>{item.cost}</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            
            {/* Empty state if no items of selected type */}
            {filteredItems.length === 0 && (
              <div className="col-span-full text-center py-8 text-gray-500">
                No {tabLabels[selectedTab].toLowerCase()} available yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvatarCustomizer;
