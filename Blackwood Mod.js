// ==UserScript==
// @name         Blackwood Mod
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Мод для улучшенного опыта в аб
// @copyright    2025, fifthrank
// @license      MIT
// @match        *://*/cw3/*
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @downloadURL  https://raw.githubusercontent.com/fifthrank/FightEnhancer/main/Blackwood-Mod.user.js
// @updateURL    https://raw.githubusercontent.com/fifthrank/FightEnhancer/main/Blackwood-Mod.user.js
// ==/UserScript==

(function() {
    'use strict';
    function _0x12cd(_0x3a9e8d, _0x12cd3e) {
        _0x3a9e8d = _0x3a9e8d - 0x0;
        return [
            String.fromCharCode(99,119,51,47,111,100,111,114,111,106,47,51,49,51),
            'length',
            'querySelectorAll',
            'src',
            'itemList',
            'map',
            'cat_tooltip',
            'ol.mouth img',
            'closest',
            'includes',
            'warning',
            '\u0421\u041e\u0411\u0421\u0422\u0412\u0415\u041d\u041d\u041e\u0421\u0422\u042c \u0427\u0415\u0420\u041d\u041e\u041b\u0415\u0421\u042c\u042f',
            'cwe-content',
            'innerHTML',
            '\u0412\u044b \u043d\u0435 \u0441\u043e\u0441\u0442\u043e\u0438\u0442\u0435 \u0432\u043e \u0444\u0440\u0430\u043a\u0446\u0438\u0438 \u0427\u0435\u0440\u043d\u043e\u043b\u0435\u0441\u044c\u0435',
            'div'
        ][_0x3a9e8d];
    }

    // НАСТРОЙКИ
    let config = {
        arrowId: GM_getValue('arrowId', ''),
        energyTracker: GM_getValue('energyTracker', true),
        diagonalSkin: GM_getValue('diagonalSkin', false),
        removeCostumes: GM_getValue('removeCostumes', false),
        dangerSkins: GM_getValue('dangerSkins', false),
        gridMode: GM_getValue('gridMode', 0),
        soundVolume: GM_getValue('soundVolume', 66),
        backgroundImage: GM_getValue('backgroundImage', 'https://i.ibb.co/d8kBBCy/image.png'),
        uiExpanded: GM_getValue('uiExpanded', false),
        teamsExpanded: GM_getValue('teamsExpanded', false),
        teamsPosX: GM_getValue('teamsPosX', 250),
        teamsPosY: GM_getValue('teamsPosY', 100),
        posX: GM_getValue('posX', 20),
        posY: GM_getValue('posY', 100),
        teamColors: GM_getValue('teamColors', {
            team1g: "#52DA69",
            team1r: "#CD4141",
            team2g: "#008FF5",
            team2r: "#CD4141",
            team3g: "#FFBF00",
            team3r: "#CD4141",
            team4g: "#E298CF",
            team4r: "#CD4141"
        }),
        teamAssignments: GM_getValue('teamAssignments', {})
    };

    // Инициализация команд при загрузке
    if (Object.keys(config.teamAssignments).length > 0) {
        updateTeamColors();
    }

    const DIAGONAL_SKIN_CONFIG = {
        url: 'https://i.ibb.co/k601Xs4X/6.png',
        minSize: 55,
        maxSize: 100,
        className: 'diagonal-skin-element',
        zIndex: -11
    };

    const GRID_STYLES = {
        0: '',
        1: 'td.cage { box-shadow: inset 0px 0px 0px 0.30px black; }',
        2: 'td.cage { box-shadow: inset 0px 0px 0px 0.30px white; }',
        3: 'td.cage { box-shadow: inset 0px 0px 0px 0.30px gray; }'
    };

    // Стили для опасных костюмов
    const DANGER_SKINS_STYLES = `
        [style*='/cw3/cats/0/defects/wound/4'] {
            background-image: url(https://i.ibb.co/NdPQDKL0/4.png) !important;
        }
        [style*='/cw3/cats/0/defects/wound/3'] {
            background-image: url(https://i.ibb.co/hF8pMnZs/3.png) !important;
        }
        [style*='/cw3/cats/0/defects/wound/2'] {
            background-image: url(https://i.ibb.co/Tn35nKf/2.png) !important;
        }
        [style*='/cw3/cats/0/defects/wound/1'] {
            background-image: url(https://i.ibb.co/8ggvPwjm/1.png) !important;
        }
    `;

    let isDragging = false;
    let dragStartX, dragStartY, elementStartX, elementStartY;
    let energyTrackerInterval = null;
    let lastEnergyUpdate = 0;
    const ENERGY_UPDATE_DELAY = 20;
    let costumeObserver = null;
    let dangerSkinObserver = null;
    let gridStyleElement = null;
    let diagonalSkinObserver = null;
    let diagonalSkinInterval = null;
    let teamColorObserver = null;
    let isTeamsDragging = false;
    let isColorSettingsDragging = false;
    let colorPickerOpen = false;
    let dangerSkinsStyleElement = null;
    let originalWoundStyles = {};

    // ИНТЕРФЕЙС
    GM_addStyle(`
        #cages_div {
            opacity: 1 !important;
        }

        #cwe-container {
            position: fixed;
            top: ${Math.min(Math.max(config.posY, 0), window.innerHeight - 30)}px;
            left: ${Math.min(Math.max(config.posX, 0), window.innerWidth - 200)}px;
            width: 200px;
            min-height: 30px;
            background: rgba(40, 40, 40, 0.8);
            border: 2px solid #2d4a2d;
            border-radius: 5px;
            color: #e0e0e0;
            font-family: "Comic Sans MS", cursive, sans-serif;
            z-index: 9999;
            overflow: visible;
            transition: height 0.3s ease;
            box-shadow: 0 0 10px rgba(0,0,0,0.5);
            user-select: none;
        }

        #cwe-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: url('${config.backgroundImage}');
            background-size: cover;
            background-position: center;
            opacity: 0.5;
            z-index: -1;
            border-radius: 3px;
        }

        #cwe-header {
            padding: 5px;
            background: rgba(45, 60, 45, 0.7);
            cursor: move;
            font-weight: bold;
            border-bottom: 1px solid #2d4a2d;
            white-space: nowrap;
            font-size: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        #cwe-header-title {
            flex-grow: 1;
            padding-right: 10px;
            cursor: pointer;
        }

        #cwe-toggle-btn {
            cursor: pointer;
            padding: 0 5px;
            font-size: 14px;
            width: 20px;
            text-align: center;
        }

        #cwe-content {
            padding: 8px;
            display: ${config.uiExpanded ? 'block' : 'none'};
            font-size: 11px;
        }

        .cwe-section {
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid rgba(45, 60, 45, 0.5);
        }

        .cwe-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 8px;
            white-space: nowrap;
        }

        .cwe-label {
            margin-right: 5px;
            text-align: left;
            display: flex;
            align-items: center;
        }

        .cwe-help {
            color: #8a9c8a;
            cursor: help;
            position: relative;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 14px;
            height: 14px;
            font-size: 11px;
            margin-right: -14px;
        }

        .cwe-tooltip {
            display: none;
            position: absolute;
            background: rgba(30, 40, 30, 0.98);
            border: 1px solid #2d4a2d;
            padding: 6px;
            min-width: 180px;
            max-width: 250px;
            z-index: 10000;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            border-radius: 4px;
            text-align: left;
            box-shadow: 0 0 8px rgba(0,0,0,0.6);
            font-family: "Comic Sans MS", cursive, sans-serif;
            margin-bottom: 5px;
            pointer-events: none;
            font-size: 10px;
            white-space: normal;
            word-wrap: break-word;
        }

        .cwe-help:hover .cwe-tooltip {
            display: block;
        }

        .cwe-select-container {
            display: flex;
            align-items: center;
            width: 100px;
        }

        .cwe-select-arrow {
            cursor: pointer;
            padding: 0 5px;
            font-weight: bold;
        }

        .cwe-select-value {
            flex-grow: 1;
            text-align: center;
            padding: 3px;
            background: #111111;
            color: #e0e0e0;
            border: 1px solid #3a5a3a;
            border-radius: 3px;
            font-size: 11px;
            font-family: "Comic Sans MS", cursive, sans-serif;
            width: 60px;
        }

        #cwe-arrow-id {
            width: 100px;
            padding: 3px;
            background: #111111;
            color: #e0e0e0;
            border: 1px solid #3a5a3a;
            border-radius: 3px;
            font-size: 11px;
            text-align: center;
            font-family: "Comic Sans MS", cursive, sans-serif;
        }

        .cwe-toggle {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 8px;
            cursor: pointer;
        }

        .cwe-toggle-switch {
            position: relative;
            width: 40px;
            height: 20px;
            background: #2d4a2d;
            border-radius: 10px;
            transition: background 0.3s;
        }

        .cwe-toggle-switch:after {
            content: '';
            position: absolute;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #e0e0e0;
            top: 2px;
            left: 2px;
            transition: transform 0.3s;
        }

        .cwe-toggle.active .cwe-toggle-switch {
            background: #3a8a3a;
        }

        .cwe-toggle.active .cwe-toggle-switch:after {
            transform: translateX(20px);
        }

        .cwe-toggle-label {
            margin-right: 10px;
            display: flex;
            align-items: center;
        }

        .energy-percent-final {
            position: absolute;
            bottom: 2px;
            left: 50%;
            transform: translateX(-50%);
            font-weight: bold;
            pointer-events: none;
            background: rgba(0, 0, 0, 0.4);
            border-radius: 3px;
            padding: 1px 6px;
            white-space: nowrap;
            z-index: 100;
            text-shadow: 0 0 2px #000;
            font-size: 10px;
        }

        .mashroom-costume {
            position: absolute;
            width: 100%;
            height: auto;
            pointer-events: none;
            z-index: -10;
            top: 0;
            left: 0;
        }

        .${DIAGONAL_SKIN_CONFIG.className} {
            position: absolute;
            width: 100%;
            height: auto;
            pointer-events: none;
            z-index: ${DIAGONAL_SKIN_CONFIG.zIndex};
            top: 0;
            left: 0;
        }

        #cwe-teams-container {
            position: fixed;
            top: ${Math.min(Math.max(config.teamsPosY, 0), window.innerHeight - 180)}px;
            left: ${Math.min(Math.max(config.teamsPosX, 0), window.innerWidth - 270)}px;
            width: 270px;
            height: 180px;
            background: rgba(40, 40, 40, 0.9);
            border: 2px solid #2d4a2d;
            border-radius: 5px;
            color: #e0e0e0;
            font-family: "Comic Sans MS", cursive, sans-serif;
            z-index: 10000;
            overflow: hidden;
            box-shadow: 0 0 10px rgba(0,0,0,0.5);
            display: ${config.teamsExpanded ? 'block' : 'none'};
        }

        #cwe-teams-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: url('${config.backgroundImage}');
            background-size: cover;
            background-position: center;
            opacity: 0.5;
            z-index: -1;
            border-radius: 3px;
        }

        #cwe-teams-header {
            padding: 5px;
            background: rgba(45, 60, 45, 0.7);
            cursor: move;
            font-weight: bold;
            border-bottom: 1px solid #2d4a2d;
            white-space: nowrap;
            font-size: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        #cwe-teams-content {
            padding: 8px;
            overflow-y: auto;
            height: 120px;
            font-size: 11px;
        }

        #cwe-teams-buttons {
            display: flex;
            justify-content: space-between;
            padding: 0 8px 8px;
        }

        #cwe-teams-refresh {
            padding: 5px 10px;
            background: rgba(45, 60, 45, 0.7);
            border: 1px solid #2d4a2d;
            border-radius: 3px;
            cursor: pointer;
            font-size: 11px;
            flex: 1;
            margin-right: 5px;
        }

        #cwe-teams-refresh:hover {
            background: rgba(45, 80, 45, 0.8);
        }

        #cwe-teams-reset {
            padding: 5px 10px;
            background: rgba(90, 45, 45, 0.7);
            border: 1px solid #5a2d2d;
            border-radius: 3px;
            cursor: pointer;
            font-size: 11px;
            flex: 1;
        }

        #cwe-teams-reset:hover {
            background: rgba(100, 45, 45, 0.8);
        }

        .cwe-team-row {
            display: flex;
            align-items: center;
            margin-bottom: 5px;
            padding-bottom: 5px;
            border-bottom: 1px solid rgba(45, 60, 45, 0.3);
        }

        .cwe-team-name {
            flex: 1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            margin-right: 10px;
        }

        .cwe-team-color {
            width: 20px;
            height: 20px;
            margin: 0 2px;
            border: 1px solid #3a5a3a;
            border-radius: 3px;
            cursor: pointer;
            position: relative;
        }

        .cwe-team-color.selected {
            border: 2px solid #fff;
        }

        .cwe-team-btn {
            display: block;
            width: 90%;
            margin: 5px auto;
            padding: 5px;
            background: ${config.teamsExpanded ? '#2d4a2d' : 'rgba(45, 60, 45, 0.7)'};
            border: 1px solid #2d4a2d;
            border-radius: 3px;
            cursor: pointer;
            font-size: 11px;
            text-align: center;
            transition: background 0.3s;
        }

        .cwe-team-btn:hover {
            background: ${config.teamsExpanded ? '#3a5a3a' : 'rgba(45, 80, 45, 0.8)'};
        }

        #cwe-color-settings-btn {
            padding: 2px 5px;
            background: rgba(45, 60, 45, 0.7);
            border: 1px solid #2d4a2d;
            border-radius: 3px;
            cursor: pointer;
            font-size: 11px;
            margin-left: 5px;
        }

        #cwe-color-settings-btn:hover {
            background: rgba(45, 80, 45, 0.8);
        }

        #cwe-color-settings {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 260px;
            background: rgba(40, 40, 40, 0.95);
            border: 2px solid #2d4a2d;
            border-radius: 5px;
            color: #e0e0e0;
            font-family: "Comic Sans MS", cursive, sans-serif;
            z-index: 10000;
            padding: 8px;
            display: none;
        }

        #cwe-color-settings::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0,
            right: 0,
            bottom: 0,
            background-image: url('${config.backgroundImage}');
            background-size: cover;
            background-position: center;
            opacity: 0.5;
            z-index: -1;
            border-radius: 3px;
        }

        #cwe-color-settings-header {
            padding: 5px;
            background: rgba(45, 60, 45, 0.7);
            font-weight: bold;
            border-bottom: 1px solid #2d4a2d;
            margin-bottom: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: move;
            font-size: 11px;
        }

        #cwe-color-settings-close {
            cursor: pointer;
            font-weight: bold;
            padding: 0 5px;
            font-size: 14px;
        }

        .cwe-color-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
            font-size: 10px;
        }

        .cwe-color-table th, .cwe-color-table td {
            border: 1px solid #3a5a3a;
            padding: 3px;
            text-align: center;
        }

        .cwe-color-table th {
            background: rgba(45, 60, 45, 0.5);
        }

        .cwe-color-input {
            width: 25px;
            height: 25px;
            border: none;
            cursor: pointer;
            padding: 0;
        }

        #cwe-color-settings-save {
            display: block;
            width: 100%;
            padding: 5px;
            background: rgba(45, 60, 45, 0.7);
            border: 1px solid #2d4a2d;
            border-radius: 3px;
            cursor: pointer;
            font-size: 11px;
            text-align: center;
        }

        #cwe-color-settings-save:hover {
            background: rgba(45, 80, 45, 0.8);
        }

        .cwe-divider {
            color: white;
            font-weight: bold;
            margin: 0 5px;
        }

        /* Стили для опасных костюмов */
        .danger-skin {
            position: absolute;
            width: 100%;
            height: auto;
            pointer-events: none;
            z-index: -9;
            top: 0;
            left: 0;
        }

        /* Стили для звукового контрола */
        #cwe-sound-control {
            margin-top: 10px;
        }

        #cwe-sound-slider {
            width: 180px;
            height: 6px;
            background: #5a8f5a;
            border-radius: 3px;
            margin: 5px auto;
            position: relative;
        }

        #cwe-sound-slider-handle {
            width: 12px;
            height: 12px;
            background: #fff;
            border: 1px solid #5a8f5a;
            border-radius: 50%;
            position: absolute;
            top: -4px;
            left: ${config.soundVolume}%;
            transform: translateX(-50%);
            cursor: pointer;
        }

        #cwe-sound-value {
            text-align: center;
            font-weight: bold;
            margin: 5px 0;
            font-size: 11px;
        }
    `);

    function createUI() {
        const container = document.createElement('div');
        container.id = 'cwe-container';

        let contentHTML = `
            <div id="cwe-header">
                <div id="cwe-header-title">Blackwood Mod</div>
                <div id="cwe-toggle-btn">${config.uiExpanded ? '▲' : '▼'}</div>
            </div>
            <div id="cwe-content">
                <div class="cwe-section">
                    <div class="cwe-row">
                        <span class="cwe-label">Ваш ID</span>
                        <input type="text" id="cwe-arrow-id" value="${config.arrowId}">
                    </div>
                </div>

                <div class="cwe-section">
                    <div class="cwe-toggle ${config.energyTracker ? 'active' : ''}" id="cwe-energy-tracker">
                        <span class="cwe-toggle-label">Трекер энергии
                            <div class="cwe-help">❔
                                <div class="cwe-tooltip">
                                    Показывает процент оставшейся энергии под каждым котом на поле боя.<br>
                                    Зеленый - 100%-50%, желтый - 50%-25%, оранжевый - 25%-1%, красный - 0%.
                                </div>
                            </div>
                        </span>
                        <div class="cwe-toggle-switch"></div>
                    </div>

                    <div class="cwe-toggle ${config.diagonalSkin ? 'active' : ''}" id="cwe-diagonal-skin">
                        <span class="cwe-toggle-label">Диагонали
                            <div class="cwe-help">❔
                                <div class="cwe-tooltip">
                                    Добавляет специальный костюм для персонажа, который помогает визуально ориентироваться в диагоналях. Не работает без ввода ID.
                                </div>
                            </div>
                        </span>
                        <div class="cwe-toggle-switch"></div>
                    </div>

                    <div class="cwe-toggle ${config.removeCostumes ? 'active' : ''}" id="cwe-remove-costumes">
                        <span class="cwe-toggle-label">Снять костюмы
                            <div class="cwe-help">❔
                                <div class="cwe-tooltip">
                                    Убирает все костюмы с персонажей на поле боя. ВАЖНО: удаляет костюмы с ботов.
                                </div>
                            </div>
                        </span>
                        <div class="cwe-toggle-switch"></div>
                    </div>

                    <div class="cwe-toggle ${config.dangerSkins ? 'active' : ''}" id="cwe-danger-skins">
                        <span class="cwe-toggle-label">Опаски
                            <div class="cwe-help">❔
                                <div class="cwe-tooltip">
                                    Заменяет стандартные изображения ранений на более заметные варианты.
                                </div>
                            </div>
                        </span>
                        <div class="cwe-toggle-switch"></div>
                    </div>

                    <div class="cwe-row">
                        <span class="cwe-label">Сетка</span>
                        <div class="cwe-select-container">
                            <span class="cwe-select-arrow">◄</span>
                            <span class="cwe-select-value" id="cwe-grid-mode-value">${['Выкл','Черная','Белая','Серая'][config.gridMode]}</span>
                            <span class="cwe-select-arrow">►</span>
                        </div>
                    </div>
                </div>

                <div class="cwe-section">
                    <div id="cwe-sound-control">
                        <div class="cwe-row" style="justify-content: center; margin-bottom: 5px;">
                            <span class="cwe-label">Озвучка игровой</span>
                        </div>
                        <div id="cwe-sound-slider">
                            <div id="cwe-sound-slider-handle"></div>
                        </div>
                        <div id="cwe-sound-value">${config.soundVolume}%</div>
                    </div>
                </div>

                <div class="cwe-section">
                    <button class="cwe-team-btn" id="cwe-teams-btn">Команды</button>
                </div>

                <div id="cwe-footer">
                    <a href="https://catwar.net/blog685095" target="_blank">${_0x12cd('0xb')}</a>
                </div>
            </div>
        `;

        container.innerHTML = contentHTML;
        document.body.appendChild(container);

        const teamsContainer = document.createElement('div');
        teamsContainer.id = 'cwe-teams-container';
        teamsContainer.innerHTML = `
            <div id="cwe-teams-header">
                <span>Настройки команд</span>
                <button id="cwe-color-settings-btn">Настройка цвета</button>
            </div>
            <div id="cwe-teams-content"></div>
            <div id="cwe-teams-buttons">
                <button id="cwe-teams-refresh">Обновить список</button>
                <button id="cwe-teams-reset">Сбросить команды</button>
            </div>
        `;
        document.body.appendChild(teamsContainer);

        const colorSettings = document.createElement('div');
        colorSettings.id = 'cwe-color-settings';
        colorSettings.innerHTML = `
            <div id="cwe-color-settings-header">
                <span>Настройка цвета команд</span>
                <span id="cwe-color-settings-close">✕</span>
            </div>
            <table class="cwe-color-table">
                <tr>
                    <th>Цвет</th>
                    <th>1</th>
                    <th>2</th>
                    <th>3</th>
                    <th>4</th>
                </tr>
                <tr>
                    <th>Зеленый</th>
                    <td><input type="color" class="cwe-color-input" id="cwe-color-team1g" value="${config.teamColors.team1g}"></td>
                    <td><input type="color" class="cwe-color-input" id="cwe-color-team2g" value="${config.teamColors.team2g}"></td>
                    <td><input type="color" class="cwe-color-input" id="cwe-color-team3g" value="${config.teamColors.team3g}"></td>
                    <td><input type="color" class="cwe-color-input" id="cwe-color-team4g" value="${config.teamColors.team4g}"></td>
                </tr>
                <tr>
                    <th>Красный</th>
                    <td><input type="color" class="cwe-color-input" id="cwe-color-team1r" value="${config.teamColors.team1r}"></td>
                    <td><input type="color" class="cwe-color-input" id="cwe-color-team2r" value="${config.teamColors.team2r}"></td>
                    <td><input type="color" class="cwe-color-input" id="cwe-color-team3r" value="${config.teamColors.team3r}"></td>
                    <td><input type="color" class="cwe-color-input" id="cwe-color-team4r" value="${config.teamColors.team4r}"></td>
                </tr>
            </table>
            <button id="cwe-color-settings-save">Сохранить</button>
        `;
        document.body.appendChild(colorSettings);

        setupSelectControl('cwe-grid-mode', ['Выкл','Черная','Белая','Серая'], config.gridMode, (value) => {
            config.gridMode = value;
            GM_setValue('gridMode', config.gridMode);
            updateGridStyle();
        });

        document.getElementById('cwe-toggle-btn').addEventListener('click', toggleUI);
        document.getElementById('cwe-header-title').addEventListener('click', toggleUI);
        document.getElementById('cwe-arrow-id').addEventListener('change', updateArrowId);
        document.getElementById('cwe-energy-tracker').addEventListener('click', toggleEnergyTracker);
        document.getElementById('cwe-diagonal-skin').addEventListener('click', toggleDiagonalSkin);
        document.getElementById('cwe-remove-costumes').addEventListener('click', toggleRemoveCostumes);
        document.getElementById('cwe-danger-skins').addEventListener('click', toggleDangerSkins);
        document.getElementById('cwe-teams-btn').addEventListener('click', toggleTeamsUI);
        document.getElementById('cwe-teams-refresh').addEventListener('click', refreshTeamList);
        document.getElementById('cwe-teams-reset').addEventListener('click', resetTeams);
        document.getElementById('cwe-color-settings-btn').addEventListener('click', showColorSettings);
        document.getElementById('cwe-color-settings-close').addEventListener('click', hideColorSettings);
        document.getElementById('cwe-color-settings-save').addEventListener('click', saveColorSettings);

        setupSoundControl();

        setupDrag();
        setupTeamsDrag();
        setupColorSettingsDrag();

        if (config.energyTracker) startEnergyTracker();
        if (config.diagonalSkin) startDiagonalSkin();
        if (config.removeCostumes) startRemoveCostumes();
        if (config.dangerSkins) startDangerSkins();
        if (config.gridMode > 0) updateGridStyle();
        if (config.teamsExpanded) refreshTeamList();
    }

    function updateArrowId() {
        config.arrowId = this.value;
        GM_setValue('arrowId', config.arrowId);
        if (config.diagonalSkin) {
            stopDiagonalSkin();
            startDiagonalSkin();
        }
    }

    function setupSoundControl() {
        const slider = document.getElementById('cwe-sound-slider');
        const handle = document.getElementById('cwe-sound-slider-handle');
        const valueDisplay = document.getElementById('cwe-sound-value');

        let isDragging = false;

        function updateVolume(volume) {
            config.soundVolume = volume;
            GM_setValue('soundVolume', volume);
            valueDisplay.textContent = volume + '%';
            handle.style.left = volume + '%';

            try {
                if (window.soundManager && typeof window.soundManager.setVolume === 'function') {
                    window.soundManager.setVolume(volume);
                }
                else {
                    document.querySelectorAll('audio').forEach(audio => {
                        audio.volume = volume / 100;
                    });
                }
            } catch (e) {
                console.log('Ошибка изменения громкости:', e);
            }

            fetch('https://catwar.net/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `sound=${volume}`,
                credentials: 'include',
                keepalive: true
            }).catch(e => console.log('Ошибка сохранения:', e));
        }

        function playGameSound() {
            if (window.soundManager && typeof window.soundManager.play === 'function') {
                window.soundManager.play();
                return true;
            }

            const audioElements = document.querySelectorAll('audio');
            if (audioElements.length > 0) {
                audioElements.forEach(audio => {
                    audio.volume = config.soundVolume / 100;
                    audio.play().catch(e => console.log('Автовоспроизведение заблокировано:', e));
                });
                return true;
            }

            setTimeout(() => {
                playGameSound();
            }, 1000);

            return false;
        }

        document.addEventListener('DOMContentLoaded', playGameSound);
        window.addEventListener('load', playGameSound);

        handle.addEventListener('mousedown', function(e) {
            isDragging = true;
            e.preventDefault();
        });

        document.addEventListener('mousemove', function(e) {
            if (!isDragging) return;

            const sliderRect = slider.getBoundingClientRect();
            const sliderWidth = slider.offsetWidth;

            let pos = e.clientX - sliderRect.left;
            pos = Math.max(0, Math.min(pos, sliderWidth));

            const percent = Math.round((pos / sliderWidth) * 100);
            handle.style.left = percent + '%';
            updateVolume(percent);
        });

        document.addEventListener('mouseup', function() {
            isDragging = false;
        });

        slider.addEventListener('click', function(e) {
            const sliderRect = slider.getBoundingClientRect();
            const sliderWidth = slider.offsetWidth;

            let pos = e.clientX - sliderRect.left;
            pos = Math.max(0, Math.min(pos, sliderWidth));

            const percent = Math.round((pos / sliderWidth) * 100);
            handle.style.left = percent + '%';
            updateVolume(percent);
        });

        setInterval(() => {
            if (window.soundManager && !window.soundManager.isPlaying()) {
                window.soundManager.play();
            }
        }, 5000);
    }

    function showColorSettings() {
        document.getElementById('cwe-color-settings').style.display = 'block';
        colorPickerOpen = true;
    }

    function hideColorSettings() {
        document.getElementById('cwe-color-settings').style.display = 'none';
        colorPickerOpen = false;
    }

    function saveColorSettings() {
        config.teamColors.team1g = document.getElementById('cwe-color-team1g').value;
        config.teamColors.team1r = document.getElementById('cwe-color-team1r').value;
        config.teamColors.team2g = document.getElementById('cwe-color-team2g').value;
        config.teamColors.team2r = document.getElementById('cwe-color-team2r').value;
        config.teamColors.team3g = document.getElementById('cwe-color-team3g').value;
        config.teamColors.team3r = document.getElementById('cwe-color-team3r').value;
        config.teamColors.team4g = document.getElementById('cwe-color-team4g').value;
        config.teamColors.team4r = document.getElementById('cwe-color-team4r').value;

        GM_setValue('teamColors', config.teamColors);
        hideColorSettings();
        refreshTeamList();
        updateTeamColors();
    }

    function resetTeams() {
        config.teamAssignments = {};
        GM_setValue('teamAssignments', config.teamAssignments);
        refreshTeamList();
        updateTeamColors();
    }

    function updateTeamColors() {
        const styleElement = document.getElementById('cwe-team-colors-style');
        if (styleElement) {
            styleElement.remove();
        }

        let styleContent = '';
        for (const [arrowId, team] of Object.entries(config.teamAssignments)) {
            styleContent += `
                #arrow${arrowId} .arrow_green { background: ${config.teamColors[`team${team}g`]} !important; }
                #arrow${arrowId} .arrow_red { background: ${config.teamColors[`team${team}r`]} !important; }
            `;
        }

        const newStyleElement = document.createElement('style');
        newStyleElement.id = 'cwe-team-colors-style';
        newStyleElement.textContent = styleContent;
        document.head.appendChild(newStyleElement);
    }

    function setupSelectControl(prefix, options, currentValue, callback) {
        const valueElement = document.getElementById(`${prefix}-value`);
        const leftArrow = valueElement.previousElementSibling;
        const rightArrow = valueElement.nextElementSibling;

        leftArrow.addEventListener('click', () => {
            let newValue = currentValue - 1;
            if (newValue < 0) newValue = options.length - 1;
            valueElement.textContent = options[newValue];
            callback(newValue);
            currentValue = newValue;
        });

        rightArrow.addEventListener('click', () => {
            let newValue = currentValue + 1;
            if (newValue >= options.length) newValue = 0;
            valueElement.textContent = options[newValue];
            callback(newValue);
            currentValue = newValue;
        });
    }

    function setupDrag() {
        const header = document.getElementById('cwe-header');
        const container = document.getElementById('cwe-container');

        header.addEventListener('mousedown', function(e) {
            if (e.target.id === 'cwe-toggle-btn' || e.target.id === 'cwe-header-title') return;
            isDragging = true;
            dragStartX = e.clientX;
            dragStartY = e.clientY;
            const rect = container.getBoundingClientRect();
            elementStartX = rect.left;
            elementStartY = rect.top;
            e.preventDefault();
        });

        document.addEventListener('mousemove', function(e) {
            if (!isDragging) return;
            const dx = e.clientX - dragStartX;
            const dy = e.clientY - dragStartY;

            const newLeft = Math.min(Math.max(elementStartX + dx, 0), window.innerWidth - container.offsetWidth);
            const newTop = Math.min(Math.max(elementStartY + dy, 0), window.innerHeight - container.offsetHeight);

            container.style.left = newLeft + 'px';
            container.style.top = newTop + 'px';
            e.preventDefault();
        });

        document.addEventListener('mouseup', function() {
            if (!isDragging) return;
            isDragging = false;
            const rect = container.getBoundingClientRect();
            config.posX = rect.left;
            config.posY = rect.top;
            GM_setValue('posX', config.posX);
            GM_setValue('posY', config.posY);
        });
    }

    function setupTeamsDrag() {
        const header = document.getElementById('cwe-teams-header');
        const container = document.getElementById('cwe-teams-container');

        header.addEventListener('mousedown', function(e) {
            if (e.target.closest('#cwe-color-settings-btn') || colorPickerOpen) return;
            isTeamsDragging = true;
            dragStartX = e.clientX;
            dragStartY = e.clientY;
            const rect = container.getBoundingClientRect();
            elementStartX = rect.left;
            elementStartY = rect.top;
            e.preventDefault();
        });

        document.addEventListener('mousemove', function(e) {
            if (!isTeamsDragging) return;
            const dx = e.clientX - dragStartX;
            const dy = e.clientY - dragStartY;

            const newLeft = Math.min(Math.max(elementStartX + dx, 0), window.innerWidth - container.offsetWidth);
            const newTop = Math.min(Math.max(elementStartY + dy, 0), window.innerHeight - container.offsetHeight);

            container.style.left = newLeft + 'px';
            container.style.top = newTop + 'px';
            e.preventDefault();
        });

        document.addEventListener('mouseup', function() {
            if (!isTeamsDragging) return;
            isTeamsDragging = false;
            const rect = container.getBoundingClientRect();
            config.teamsPosX = rect.left;
            config.teamsPosY = rect.top;
            GM_setValue('teamsPosX', config.teamsPosX);
            GM_setValue('teamsPosY', config.teamsPosY);
        });
    }

    function setupColorSettingsDrag() {
        const header = document.getElementById('cwe-color-settings-header');
        const container = document.getElementById('cwe-color-settings');

        header.addEventListener('mousedown', function(e) {
            if (e.target.id === 'cwe-color-settings-close') return;
            isColorSettingsDragging = true;
            dragStartX = e.clientX;
            dragStartY = e.clientY;
            const rect = container.getBoundingClientRect();
            elementStartX = rect.left;
            elementStartY = rect.top;
            e.preventDefault();
        });

        document.addEventListener('mousemove', function(e) {
            if (!isColorSettingsDragging) return;
            const dx = e.clientX - dragStartX;
            const dy = e.clientY - dragStartY;

            const newLeft = Math.min(Math.max(elementStartX + dx, 0), window.innerWidth - container.offsetWidth);
            const newTop = Math.min(Math.max(elementStartY + dy, 0), window.innerHeight - container.offsetHeight);

            container.style.left = newLeft + 'px';
            container.style.top = newTop + 'px';
            e.preventDefault();
        });

        document.addEventListener('mouseup', function() {
            isColorSettingsDragging = false;
        });
    }

    function toggleUI(e) {
        const content = document.getElementById('cwe-content');
        const toggleBtn = document.getElementById('cwe-toggle-btn');

        if (content.style.display === 'block') {
            content.style.display = 'none';
            toggleBtn.innerHTML = '▼';
            document.getElementById('cwe-container').style.height = '30px';
            config.uiExpanded = false;
        } else {
            content.style.display = 'block';
            toggleBtn.innerHTML = '▲';
            document.getElementById('cwe-container').style.height = 'auto';
            config.uiExpanded = true;
        }
        GM_setValue('uiExpanded', config.uiExpanded);
    }

    function toggleTeamsUI() {
        const teamsContainer = document.getElementById('cwe-teams-container');
        const teamsBtn = document.getElementById('cwe-teams-btn');

        config.teamsExpanded = !config.teamsExpanded;
        GM_setValue('teamsExpanded', config.teamsExpanded);

        if (config.teamsExpanded) {
            teamsContainer.style.display = 'block';
            teamsBtn.style.background = '#2d4a2d';
            refreshTeamList();
        } else {
            teamsContainer.style.display = 'none';
            teamsBtn.style.background = 'rgba(45, 60, 45, 0.7)';
        }
    }

    function refreshTeamList() {
        const teamsContent = document.getElementById('cwe-teams-content');
        teamsContent.innerHTML = '';

        const arrows = document.querySelectorAll('.arrow');
        const teamRows = [];

        arrows.forEach(arrow => {
            const arrowId = arrow.id.replace('arrow', '');
            const catLink = document.querySelector(`.cat_tooltip a[href="/cat${arrowId}"]`);
            if (!catLink) return;

            const catName = catLink.textContent;
            const currentTeam = config.teamAssignments[arrowId] || '1';

            const row = document.createElement('div');
            row.className = 'cwe-team-row';
            row.innerHTML = `
                <div class="cwe-team-name">${catName}</div>
                <div class="cwe-team-color ${currentTeam === '1' ? 'selected' : ''}" style="background: ${config.teamColors.team1g}" data-team="1" data-arrow="${arrowId}"></div>
                <div class="cwe-team-color ${currentTeam === '2' ? 'selected' : ''}" style="background: ${config.teamColors.team2g}" data-team="2" data-arrow="${arrowId}"></div>
                <div class="cwe-team-color ${currentTeam === '3' ? 'selected' : ''}" style="background: ${config.teamColors.team3g}" data-team="3" data-arrow="${arrowId}"></div>
                <div class="cwe-team-color ${currentTeam === '4' ? 'selected' : ''}" style="background: ${config.teamColors.team4g}" data-team="4" data-arrow="${arrowId}"></div>
            `;

            teamRows.push(row);
        });

        if (teamRows.length === 0) {
            teamsContent.innerHTML = '<div style="text-align: center; padding: 10px;">Нет котов с стрелками на поле</div>';
        } else {
            teamRows.forEach(row => teamsContent.appendChild(row));
        }

        document.querySelectorAll('.cwe-team-color').forEach(color => {
            color.addEventListener('click', function() {
                const arrowId = this.getAttribute('data-arrow');
                const team = this.getAttribute('data-team');

                document.querySelectorAll(`.cwe-team-color[data-arrow="${arrowId}"]`).forEach(c => {
                    c.classList.remove('selected');
                });

                this.classList.add('selected');

                config.teamAssignments[arrowId] = team;
                GM_setValue('teamAssignments', config.teamAssignments);

                updateTeamColors();
            });
        });
    }

    function toggleEnergyTracker() {
        const element = document.getElementById('cwe-energy-tracker');
        element.classList.toggle('active');
        config.energyTracker = !config.energyTracker;
        GM_setValue('energyTracker', config.energyTracker);
        if (config.energyTracker) startEnergyTracker();
        else stopEnergyTracker();
    }

    function toggleDiagonalSkin() {
        const element = document.getElementById('cwe-diagonal-skin');
        element.classList.toggle('active');
        config.diagonalSkin = !config.diagonalSkin;
        GM_setValue('diagonalSkin', config.diagonalSkin);
        if (config.diagonalSkin) startDiagonalSkin();
        else stopDiagonalSkin();
    }

    function toggleRemoveCostumes() {
        const element = document.getElementById('cwe-remove-costumes');
        element.classList.toggle('active');
        config.removeCostumes = !config.removeCostumes;
        GM_setValue('removeCostumes', config.removeCostumes);
        if (config.removeCostumes) {
            startRemoveCostumes();
        } else {
            stopRemoveCostumes();
            setTimeout(() => {
                const allCats = document.querySelectorAll(".catWithArrow, .cat");
                allCats.forEach(catWrapper => {
                    const divs = catWrapper.querySelectorAll("div");
                    divs.forEach(div => {
                        if (isCostumeLayer(div)) {
                            div.style.display = "";
                        }
                    });
                });
            }, 100);
        }
    }

    function toggleDangerSkins() {
        const element = document.getElementById('cwe-danger-skins');
        element.classList.toggle('active');
        config.dangerSkins = !config.dangerSkins;
        GM_setValue('dangerSkins', config.dangerSkins);
        if (config.dangerSkins) {
            startDangerSkins();
        } else {
            stopDangerSkins();
        }
    }

    function updateGridStyle() {
        if (gridStyleElement) {
            gridStyleElement.remove();
            gridStyleElement = null;
        }

        if (config.gridMode > 0) {
            gridStyleElement = document.createElement('style');
            gridStyleElement.id = 'cwe-grid-style';
            gridStyleElement.textContent = GRID_STYLES[config.gridMode];
            document.head.appendChild(gridStyleElement);
        }
    }

    function isCostumeLayer(div) {
        const style = div.getAttribute("style");
        return style && style.includes("/cw3/cats/0/costume/");
    }

    function processCostumes() {
        const allCats = document.querySelectorAll(".catWithArrow, .cat");
        allCats.forEach(catWrapper => {
            const divs = catWrapper.querySelectorAll("div");
            divs.forEach(div => {
                if (isCostumeLayer(div)) {
                    div.style.display = config.removeCostumes ? "none" : "";
                }
            });
        });
    }

    function startRemoveCostumes() {
        if (costumeObserver) return;
        processCostumes();
        costumeObserver = new MutationObserver(processCostumes);
        costumeObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
        window.addEventListener("load", processCostumes);
        setTimeout(processCostumes, 1500);
    }

    function stopRemoveCostumes() {
        if (!costumeObserver) return;
        costumeObserver.disconnect();
        costumeObserver = null;

        const allCats = document.querySelectorAll(".catWithArrow, .cat");
        allCats.forEach(catWrapper => {
            const divs = catWrapper.querySelectorAll("div");
            divs.forEach(div => {
                if (isCostumeLayer(div)) {
                    div.style.display = "";
                }
            });
        });
    }

    function updateEnergyBars() {
        const now = Date.now();
        if (now - lastEnergyUpdate < ENERGY_UPDATE_DELAY) return;
        lastEnergyUpdate = now;

        document.querySelectorAll('.energy-percent-final').forEach(ind => {
            ind.style.display = 'none';
        });

        document.querySelectorAll('.arrow').forEach(arrow => {
            const red = arrow.querySelector('.arrow_red');
            const green = arrow.querySelector('.arrow_green');
            if (!green || !red) return;

            const greenWidth = parseFloat(green.style.width) || 0;
            const redWidth = parseFloat(red.style.width) || 0;
            const total = greenWidth + redWidth;
            if (total === 0) return;

            const percent = Math.round((greenWidth / total) * 100);
            const cage = arrow.closest('.cage');
            if (!cage) return;

            let indicator = cage.querySelector('.energy-percent-final');
            if (!indicator) {
                indicator = document.createElement('div');
                indicator.className = 'energy-percent-final';
                cage.style.position = 'relative';
                cage.appendChild(indicator);
            }

            if (percent <= 0) {
                indicator.style.color = '#FF0000';
                indicator.textContent = `💀 ${percent}% DEAD`;
            }
            else if (percent <= 25) {
                indicator.style.color = '#FFA500';
                indicator.textContent = `🔋 ${percent}%`;
            }
            else if (percent <= 50) {
                indicator.style.color = '#FFFF00';
                indicator.textContent = `🔋 ${percent}%`;
            }
            else {
                indicator.style.color = '#00FF00';
                indicator.textContent = `🔋 ${percent}%`;
            }

            indicator.style.display = 'block';
        });
    }

    function startEnergyTracker() {
        if (energyTrackerInterval) return;
        energyTrackerInterval = setInterval(updateEnergyBars, 10);
    }

    function stopEnergyTracker() {
        if (!energyTrackerInterval) return;
        clearInterval(energyTrackerInterval);
        energyTrackerInterval = null;
        document.querySelectorAll('.energy-percent-final').forEach(ind => {
            ind.style.display = 'none';
        });
    }

    function applyDiagonalSkins() {
        if (!config.diagonalSkin || !config.arrowId) return;

        const arrow = document.getElementById('arrow' + config.arrowId);
        if (!arrow) return;

        const playerCat = arrow.closest('.catWithArrow');
        if (!playerCat) return;

        const catElement = playerCat.querySelector('.cat');
        if (!catElement) return;

        if (catElement.querySelector('.' + DIAGONAL_SKIN_CONFIG.className)) return;

        const layers = catElement.querySelectorAll('div[style*="background-size"]');
        if (!layers.length) return;

        const sizeMatch = layers[0].style.backgroundSize.match(/(\d+)%/);
        if (!sizeMatch) return;

        const size = parseInt(sizeMatch[1]);
        if (isNaN(size) || size < DIAGONAL_SKIN_CONFIG.minSize || size > DIAGONAL_SKIN_CONFIG.maxSize) return;

        const diagonalElement = document.createElement('img');
        diagonalElement.src = DIAGONAL_SKIN_CONFIG.url;
        diagonalElement.className = DIAGONAL_SKIN_CONFIG.className;
        diagonalElement.style.position = 'absolute';
        diagonalElement.style.width = `${size}%`;
        diagonalElement.style.height = 'auto';
        diagonalElement.style.top = '0';
        diagonalElement.style.left = '0';
        diagonalElement.style.pointerEvents = 'none';
        diagonalElement.style.zIndex = DIAGONAL_SKIN_CONFIG.zIndex;

        catElement.insertBefore(diagonalElement, catElement.firstChild);
    }

    function startDiagonalSkin() {
        if (!config.diagonalSkin) return;

        applyDiagonalSkins();

        if (!diagonalSkinObserver) {
            diagonalSkinObserver = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.addedNodes) {
                        applyDiagonalSkins();
                    }
                });
            });

            diagonalSkinObserver.observe(document.body, {
                childList: true,
                subtree: true
            });
        }

        if (!diagonalSkinInterval) {
            diagonalSkinInterval = setInterval(applyDiagonalSkins, 500);
        }
    }

    function stopDiagonalSkin() {
        document.querySelectorAll('.' + DIAGONAL_SKIN_CONFIG.className).forEach(el => el.remove());

        if (diagonalSkinObserver) {
            diagonalSkinObserver.disconnect();
            diagonalSkinObserver = null;
        }

        if (diagonalSkinInterval) {
            clearInterval(diagonalSkinInterval);
            diagonalSkinInterval = null;
        }
    }

    function saveOriginalWoundStyles() {
        const woundElements = document.querySelectorAll('[style*="/cw3/cats/0/defects/wound/"]');
        woundElements.forEach(el => {
            const arrowId = el.closest('.catWithArrow')?.querySelector('.arrow')?.id.replace('arrow', '');
            if (arrowId && !originalWoundStyles[arrowId]) {
                originalWoundStyles[arrowId] = el.getAttribute('style');
            }
        });
    }

    function applyDangerSkins() {
        if (!config.dangerSkins) return;

        saveOriginalWoundStyles();

        if (dangerSkinsStyleElement) {
            dangerSkinsStyleElement.remove();
        }

        dangerSkinsStyleElement = document.createElement('style');
        dangerSkinsStyleElement.id = 'danger-skins-style';
        dangerSkinsStyleElement.textContent = DANGER_SKINS_STYLES;
        document.head.appendChild(dangerSkinsStyleElement);
    }

    function restoreOriginalWoundStyles() {
        for (const [arrowId, style] of Object.entries(originalWoundStyles)) {
            const woundElement = document.querySelector(`#arrow${arrowId} [style*="/cw3/cats/0/defects/wound/"]`);
            if (woundElement) {
                woundElement.setAttribute('style', style);
            }
        }
    }

    function startDangerSkins() {
        if (dangerSkinObserver) return;

        applyDangerSkins();

        dangerSkinObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.addedNodes) {
                    applyDangerSkins();
                }
            });
        });

        dangerSkinObserver.observe(document.body, {
            childList: true,
            subtree: true
        });

        window.addEventListener('load', applyDangerSkins);
        setTimeout(applyDangerSkins, 2000);
    }

    function stopDangerSkins() {
        if (!dangerSkinObserver) return;

        dangerSkinObserver.disconnect();
        dangerSkinObserver = null;

        if (dangerSkinsStyleElement) {
            dangerSkinsStyleElement.remove();
            dangerSkinsStyleElement = null;
        }

        restoreOriginalWoundStyles();
    }

    const waitForLoad = setInterval(() => {
        const ready = document.querySelector('#itemList');
        if (ready) {
            clearInterval(waitForLoad);
            createUI();
        }
    }, 300);
})();