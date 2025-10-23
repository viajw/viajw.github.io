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
    let currentCorrectAnswer = null; // (이제 정답 '단어'가 저장됨)
    let isChecking = false;

    // 통계 객체 (변경 없음)
    const stats = {
        correct: 0,
        incorrect: 0,
        wordDetail: new Map() 
    };

    // 4. vocabulary.txt 파일 불러오기 (캐시 방지 코드 포함)
    async function fetchVocabulary() {
        try {
            // (캐시 방지 기능이 적용된 fetch)
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

    // 9. 새 퀴즈 문제 불러오기 (질문: 뜻, 정답: 단어)
    function loadNewQuiz() {
        isChecking = false;
        feedbackElement.textContent = '';
        feedbackElement.className = '';
        optionsContainer.innerHTML = '';

        const questionIndex = Math.floor(Math.random() * vocabulary.length);
        const question = vocabulary[questionIndex];
        
        // [로직 반전 1] 질문으로 '뜻'을 표시
        wordDisplay.textContent = question.meaning;
        // [로직 반전 2] 정답으로 '단어'를 저장
        currentCorrectAnswer = question.word;

        // 6. 5가지 보기 생성
        let options = new Set();
        // [로직 반전 3] 정답 보기로 '단어'를 추가
        options.add(question.word);

        // 정답 외 4개의 랜덤 오답 '단어' 추가
        while (options.size < 5) {
            const randomIndex = Math.floor(Math.random() * vocabulary.length);
            // [로직 반전 4] 오답 보기로 '단어'를 추가
            options.add(vocabulary[randomIndex].word);
        }

        // Set을 배열로 변환 후 랜덤으로 섞기
        const shuffledOptions = Array.from(options).sort(() => Math.random() - 0.5);

        // 6. 보기 버튼 생성
        shuffledOptions.forEach(optionText => {
            const button = document.createElement('button');
            button.textContent = optionText;
            // [로직 반전 5] 확인 함수에 선택한 '단어'를 전달
            button.addEventListener('click', () => checkAnswer(optionText, button));
            optionsContainer.appendChild(button);
        });
    }

    // 7, 8. 정답 확인 (통계 로직 수정)
    // 파라미터 이름을 selectedMeaning -> selectedWord로 변경하여 명확화
    function checkAnswer(selectedWord, clickedButton) {
        if (isChecking) return;
        isChecking = true;

        const allButtons = optionsContainer.querySelectorAll('button');
        allButtons.forEach(btn => btn.disabled = true);

        // --- (통계 로직 수정) ---
        // 통계의 기준이 되는 '단어'를 가져옴 (질문이 '뜻'으로 바뀌었으므로)
        const currentQuestionWord = currentCorrectAnswer; 
        
        // 1. 단어가 통계 맵에 없으면 초기화
        if (!stats.wordDetail.has(currentQuestionWord)) {
            stats.wordDetail.set(currentQuestionWord, { correct: 0, incorrect: 0 });
        }
        // 2. 현재 단어의 통계 객체 가져오기
        const wordStat = stats.wordDetail.get(currentQuestionWord);
        // --- (통계 로직 수정 끝) ---

        // [로직 반전 6] 선택한 '단어'와 정답 '단어'를 비교
        if (selectedWord === currentCorrectAnswer) {
            // 7. 정답
            stats.correct++;
            wordStat.correct++;
            clickedButton.classList.add('correct');
            feedbackElement.textContent = '정답!';
            feedbackElement.className = 'correct';
        } else {
            // 8. 오답
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
        // (변경 없음)
        // 통계가 '단어' 기준으로 저장되므로 팝업창 로직은 수정할 필요가 없습니다.
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

        tableHTML += `</div></div>`;
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
