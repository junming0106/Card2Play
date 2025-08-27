"use client";

import React, { useState, useEffect, useCallback } from "react";
import { NintendoSwitchGame } from "@/types/collection";
import GameDataService from "@/lib/services/gameDataService";

interface GameSearchProps {
  games: NintendoSwitchGame[];
  onSelectGame: (game: NintendoSwitchGame) => void;
  disabled?: boolean;
}

export default function GameSearch({ games, onSelectGame, disabled = false }: GameSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredGames, setFilteredGames] = useState<NintendoSwitchGame[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [gameService] = useState(() => GameDataService.getInstance());

  const filterGames = useCallback(async () => {
    if (!searchTerm.trim()) {
      setFilteredGames([]);
      return;
    }

    // 使用高效能遊戲服務進行搜尋
    const results = gameService.searchGames(searchTerm, 15);
    setFilteredGames(results);
  }, [searchTerm, gameService]);

  useEffect(() => {
    // 防抖功能：延遲搜尋以提升效能
    const debounceTimer = setTimeout(() => {
      filterGames();
    }, 200); // 200ms 延遲

    return () => clearTimeout(debounceTimer);
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
          placeholder="搜尋遊戲名稱..."
          className="w-full p-2 sm:p-4 border-2 sm:border-4 border-black font-bold text-sm sm:text-lg bg-white placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
        />
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
          🔍
        </div>
      </div>

      {/* 搜尋結果下拉選單 */}
      {showDropdown && searchTerm && filteredGames.length > 0 && (
        <div className="absolute z-[100] w-full mt-1 bg-white border-2 sm:border-4 border-black shadow-[4px_4px_0px_#000000] sm:shadow-[8px_8px_0px_#000000] max-h-60 sm:max-h-80 overflow-y-auto">
          {filteredGames.map((game, index) => (
            <button
              key={index}
              onClick={() => handleSelectGame(game)}
              className="w-full p-2 sm:p-4 text-left border-b border-black hover:bg-yellow-200 focus:bg-yellow-200 focus:outline-none transition-colors"
            >
              <div className="font-black text-sm sm:text-lg">
                {game}
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