document.addEventListener('DOMContentLoaded', () => {
    // 1. HTML 요소 가져오기
    const wordDisplay = document.getElementById('word-display');
    const optionsContainer = document.getElementById('options-container');
    const feedbackElement = document.getElementById('feedback');
    const resultsButton = document.getElementById('results-button');
    const resultsContainer = document.getElementById('results-container');
    const scoreDisplay = document.getElementById('score-display');
    const missedWordsList = document.getElementById('missed-words-list');

    // ▼▼▼ 추가된 부분 ▼▼▼
    // 모달 관련 요소 추가
    const modalOverlay = document.getElementById('modal-overlay');
    const closeModalButton = document.getElementById('close-modal-button');
    // ▲▲▲ 추가된 부분 ▲▲▲

    let vocabulary = [];
    let currentCorrectAnswer = null;
    let isChecking = false;

    const stats = {
        correct: 0,
        incorrect: 0,
        missedWords: new Set()
    };

    // 4. vocabulary.txt 파일 불러오기
    async function fetchVocabulary() {
        try {
            const response = await fetch('vocabulary.txt');
            if (!response.ok) {
                throw new Error('vocabulary.txt 파일을 불러올 수 없습니다.');
            }
            const text = await response.text();
            
            vocabulary = text.trim().split('\n')
                .filter(line => line.includes(','))
                .map(line => {
                    const parts = line.split(',');
                    return {
                        word: parts[0].trim(),
                        meaning: parts.slice(1).join(',').trim()
                    };
                });

            if (vocabulary.length < 5) {
                alert('단어장에 최소 5개의 단어가 필요합니다. (vocabulary.txt 확인)');
                return;
            }
            
            loadNewQuiz();

        } catch (error) {
            console.error(error);
            wordDisplay.textContent = '단어장을 불러오는 데 실패했습니다.';
        }
    }

    // 9. 새 퀴즈 문제 불러오기
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

    // 7, 8. 정답 확인
    function checkAnswer(selectedMeaning, clickedButton) {
        if (isChecking) return;
        isChecking = true;

        const allButtons = optionsContainer.querySelectorAll('button');
        allButtons.forEach(btn => btn.disabled = true);

        if (selectedMeaning === currentCorrectAnswer) {
            stats.correct++;
            clickedButton.classList.add('correct');
            feedbackElement.textContent = '정답!';
            feedbackElement.className = 'correct';
        } else {
            stats.incorrect++;
            stats.missedWords.add(wordDisplay.textContent);
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


    // ▼▼▼ 변경된 부분 ▼▼▼
    
    // 모달을 여는 함수
    function openModal() {
        // 11-a. 정답/오답 횟수 표시
        scoreDisplay.textContent = `총 정답: ${stats.correct}회 / 총 오답: ${stats.incorrect}회`;

        // 11-b. 오답 횟수 1 이상인 단어 표시
        missedWordsList.innerHTML = '<h4>틀린 단어 목록:</h4>';
        if (stats.missedWords.size === 0) {
            missedWordsList.innerHTML += '<p>틀린 단어가 없습니다.</p>';
        } else {
            stats.missedWords.forEach(word => {
                const wordElement = document.createElement('span');
                wordElement.textContent = word;
                wordElement.className = 'missed-word';
                missedWordsList.appendChild(wordElement);
            });
        }

        // 모달과 배경을 보이게 함
        resultsContainer.classList.remove('hidden');
        modalOverlay.classList.remove('hidden');
    }

    // 모달을 닫는 함수
    function closeModal() {
        resultsContainer.classList.add('hidden');
        modalOverlay.classList.add('hidden');
    }

    // 10. 결과 확인 버튼 이벤트 (토글 대신 '열기' 기능만 하도록 수정)
    resultsButton.addEventListener('click', openModal);

    // 모달 닫기 버튼 이벤트
    closeModalButton.addEventListener('click', closeModal);

    // 모달 배경 클릭 시 닫기 이벤트
    modalOverlay.addEventListener('click', closeModal);

    // ▲▲▲ 변경된 부분 ▲▲▲


    // 퀴즈 시작
    fetchVocabulary();
});