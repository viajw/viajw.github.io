document.addEventListener('DOMContentLoaded', () => {
    // 1. HTML 요소 가져오기 (변경 없음)
    const wordDisplay = document.getElementById('word-display');
    const optionsContainer = document.getElementById('options-container');
    const feedbackElement = document.getElementById('feedback');
    const resultsButton = document.getElementById('results-button');
    const resultsContainer = document.getElementById('results-container');
    const scoreDisplay = document.getElementById('score-display');
    const missedWordsList = document.getElementById('missed-words-list');
    const modalOverlay = document.getElementById('modal-overlay');
    const closeModalButton = document.getElementById('close-modal-button');

    let vocabulary = [];
    let currentCorrectAnswer = null;
    let isChecking = false;

    // 통계 객체 (변경 없음)
    const stats = {
        correct: 0, // 전체 정답 수
        incorrect: 0, // 전체 오답 수
        wordDetail: new Map() 
    };

    // 4. vocabulary.txt 파일 불러오기
    async function fetchVocabulary() {
        try {
            const response = await fetch('vocabulary.txt', { cache: 'no-cache' });

            if (!response.ok) {
                throw new Error('vocabulary.txt 파일을 불러올 수 없습니다.');
            }
            const text = await response.text();
            
            // ▼▼▼ 이 부분이 수정되었습니다 ▼▼▼
            vocabulary = text.trim().split('\n')
                .filter(line => {
                    const trimmedLine = line.trim();
                    // 1. 빈 줄이 아니고,
                    // 2. '#'으로 시작하는 주석 줄이 아니고,
                    // 3. 쉼표(,)가 포함된 유효한 줄만 통과시킵니다.
                    return trimmedLine.length > 0 && 
                           !trimmedLine.startsWith('#') && 
                           trimmedLine.includes(',');
                })
                .map(line => {
                // ▲▲▲ 여기까지 수정되었습니다 ▲▲▲
                    const parts = line.split(',');
                    return {
                        word: parts[0].trim(),
                        meaning: parts.slice(1).join(',').trim()
                    };
                });

            // ▼▼▼ 경고 메시지도 수정되었습니다 ▼▼▼
            if (vocabulary.length < 5) {
                alert('단어장에 최소 5개의 단어가 필요합니다. (주석 처리된 줄 제외 5개 이상)');
                return;
            }
            // ▲▲▲ 수정 완료 ▲▲▲
            
            loadNewQuiz();

        } catch (error) {
            console.error(error);
            wordDisplay.textContent = '단어장을 불러오는 데 실패했습니다.';
        }
    }

    // 9. 새 퀴즈 문제 불러오기 (변경 없음)
    function loadNewQuiz() {
        isChecking = false;
        feedbackElement.textContent = '';
        feedbackElement.className = '';
        optionsContainer.innerHTML = '';

        const questionIndex = Math.floor(Math.random() * vocabulary.length);
        const question = vocabulary[questionIndex];
        
        wordDisplay.textContent = question.word;
        currentCorrectAnswer = question.meaning;

        let options = new Set();
        options.add(question.meaning);

        while (options.size < 5) {
            const randomIndex = Math.floor(Math.random() * vocabulary.length);
            options.add(vocabulary[randomIndex].meaning);
        }

        const shuffledOptions = Array.from(options).sort(() => Math.random() - 0.5);

        shuffledOptions.forEach(optionText => {
            const button = document.createElement('button');
            button.textContent = optionText;
            button.addEventListener('click', () => checkAnswer(optionText, button));
            optionsContainer.appendChild(button);
        });
    }

    // 7, 8. 정답 확인 (단어별 통계 기록 로직 추가)
    function checkAnswer(selectedMeaning, clickedButton) {
        if (isChecking) return;
        isChecking = true;

        const allButtons = optionsContainer.querySelectorAll('button');
        allButtons.forEach(btn => btn.disabled = true);

        const currentWord = wordDisplay.textContent;
        
        if (!stats.wordDetail.has(currentWord)) {
            stats.wordDetail.set(currentWord, { correct: 0, incorrect: 0 });
        }
        const wordStat = stats.wordDetail.get(currentWord);

        if (selectedMeaning === currentCorrectAnswer) {
            stats.correct++;
            wordStat.correct++;
            clickedButton.classList.add('correct');
            feedbackElement.textContent = '정답!';
            feedbackElement.className = 'correct';
        } else {
            stats.incorrect++;
            wordStat.incorrect++;
            clickedButton.classList.add('incorrect');
            feedbackElement.textContent = '오답!';
            feedbackElement.className = 'incorrect';

            allButtons.forEach(btn => {
                if (btn.textContent === currentCorrectAnswer) {
                    btn.classList.add('correct');
                }
            });
        }

        setTimeout(loadNewQuiz, 1500);
    }

    // 10, 11. 결과 확인 (모달 열기 함수)
    function openModal() {
        scoreDisplay.textContent = `총 정답: ${stats.correct}회 / 총 오답: ${stats.incorrect}회`;

        missedWordsList.innerHTML = ''; 

        let tableHTML = `
            <div class="stats-table">
                <div class="stats-header">
                    <span class="col-word">단어</span>
                    <span class="col-correct">정답</span>
                    <span class="col-incorrect">오답</span>
                </div>
                <div class="stats-body">
        `;

        if (stats.wordDetail.size === 0) {
            tableHTML += '<p style="text-align: center; padding: 20px 0;">아직 퀴즈 기록이 없습니다.</p>';
        } else {
            stats.wordDetail.forEach((counts, word) => {
                const incorrectClass = counts.incorrect > 0 ? 'is-missed' : '';
                
                tableHTML += `
                    <div class="stats-row">
                        <span class="col-word ${incorrectClass}">${word}</span>
                        <span class="col-correct">${counts.correct}</span>
                        <span class="col-incorrect ${incorrectClass}">${counts.incorrect}</span>
                    </div>
                `;
            });
        }

        tableHTML += `</div></div>`; // stats-body, stats-table 닫기
        missedWordsList.innerHTML = tableHTML;

        resultsContainer.classList.remove('hidden');
        modalOverlay.classList.remove('hidden');
    }

    // 모달을 닫는 함수 (변경 없음)
    function closeModal() {
        resultsContainer.classList.add('hidden');
        modalOverlay.classList.add('hidden');
    }

    // 이벤트 리스너 (변경 없음)
    resultsButton.addEventListener('click', openModal);
    closeModalButton.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', closeModal);

    // 퀴즈 시작
    fetchVocabulary();
});
