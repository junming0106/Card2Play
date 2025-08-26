"use client";

import React, { useState, useEffect, useCallback } from "react";
import { NintendoSwitchGame } from "@/types/collection";

interface GameSearchProps {
  games: NintendoSwitchGame[];
  onSelectGame: (game: NintendoSwitchGame) => void;
  disabled?: boolean;
}

export default function GameSearch({ games, onSelectGame, disabled = false }: GameSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredGames, setFilteredGames] = useState<NintendoSwitchGame[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const filterGames = useCallback(() => {
    if (!searchTerm.trim()) {
      setFilteredGames([]);
      return;
    }

    const filtered = games.filter(game => 
      game.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (game.titleCn && game.titleCn.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (game.titleEn && game.titleEn.toLowerCase().includes(searchTerm.toLowerCase())) ||
      game.publisher.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 10); // 最多顯示10個結果

    setFilteredGames(filtered);
  }, [searchTerm, games]);

  useEffect(() => {
    filterGames();
  }, [filterGames]);

  const handleSelectGame = (game: NintendoSwitchGame) => {
    onSelectGame(game);
    setSearchTerm("");
    setFilteredGames([]);
    setShowDropdown(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setShowDropdown(true);
  };

  const handleInputFocus = () => {
    if (searchTerm && filteredGames.length > 0) {
      setShowDropdown(true);
    }
  };

  return (
    <div className="relative">
      {/* 搜尋輸入框 */}
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          disabled={disabled}
          placeholder="搜尋遊戲名稱、發行商..."
          className="w-full p-2 sm:p-4 border-2 sm:border-4 border-black font-bold text-sm sm:text-lg bg-white placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
        />
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
          🔍
        </div>
      </div>

      {/* 搜尋結果下拉選單 */}
      {showDropdown && searchTerm && filteredGames.length > 0 && (
        <div className="absolute z-[100] w-full mt-1 bg-white border-2 sm:border-4 border-black shadow-[4px_4px_0px_#000000] sm:shadow-[8px_8px_0px_#000000] max-h-60 sm:max-h-80 overflow-y-auto">
          {filteredGames.map((game) => (
            <button
              key={game.id}
              onClick={() => handleSelectGame(game)}
              className="w-full p-2 sm:p-4 text-left border-b border-black hover:bg-yellow-200 focus:bg-yellow-200 focus:outline-none transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 mr-2">
                  <div className="font-black text-sm sm:text-lg">
                    {game.titleCn || game.title}
                  </div>
                  {game.titleCn && game.title !== game.titleCn && (
                    <div className="text-xs sm:text-sm font-bold text-gray-600">
                      {game.title}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1 sm:gap-2 mt-1">
                    <span className="text-xs sm:text-sm font-bold text-blue-600">
                      {game.publisher}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-gray-500">
                      {game.releaseDate}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className={`px-1 sm:px-2 py-1 border border-black text-xs font-bold ${
                    game.media === 'package' 
                      ? 'bg-orange-400 text-orange-900' 
                      : 'bg-purple-400 text-purple-900'
                  }`}>
                    {game.media === 'package' ? '實體' : '數位'}
                  </div>
                  {game.genre && game.genre.length > 0 && (
                    <div className="text-xs font-bold text-gray-500 hidden sm:block">
                      {game.genre[0]}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* 沒有結果提示 */}
      {showDropdown && searchTerm && filteredGames.length === 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border-4 border-black shadow-[8px_8px_0px_#000000] p-4 text-center">
          <div className="font-bold text-gray-600">
            找不到相關遊戲
          </div>
          <div className="text-sm font-bold text-gray-500 mt-1">
            試試其他關鍵字或手動新增遊戲
          </div>
        </div>
      )}
    </div>
  );
}