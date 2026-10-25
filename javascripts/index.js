const HERO_SMALLEST_SCALE = 141 / 233 // самый маленький персонаж в центре строки, из макета
const HERO_FULL_SIZE_AT = 0.6
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const modal = document.querySelector('.js-modal')
let lastFocused = null

initMenu()
initHeroRun()
initTopics()
initChoices()
initReveals()
initCharacters()
initSubscribeForm()
initModal()

// Экран 1, Экран 10: мобильное меню
function initMenu() {
    const menu = document.querySelector('.menu')
    const openButton = document.querySelector('.js-menu-open')

    const closeMenu = () => {
        menu.hidden = true
        openButton.setAttribute('aria-expanded', 'false')
        document.body.classList.remove('is-locked')
    }

    openButton.addEventListener('click', () => {
        menu.hidden = false
        openButton.setAttribute('aria-expanded', 'true')
        document.body.classList.add('is-locked')
        menu.querySelector('.js-menu-close').focus()
    })

    menu.querySelector('.js-menu-close').addEventListener('click', () => {
        closeMenu()
        openButton.focus()
    })

    menu.querySelectorAll('.js-menu-link').forEach((link) => {
        link.addEventListener('click', closeMenu)
    })

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !menu.hidden) closeMenu()
    })
}

// Экран 2: бегущая строка персонажей.
// У краёв экрана персонажи самые большие, к середине уменьшаются, в центре самые маленькие.
// Высоты из макета: 233 и 141 px на десктопе, 117 и 71 px на телефоне, то есть одна пропорция.
function initHeroRun() {
    document.querySelectorAll('.js-hero-run').forEach((track) => {
        // вторая копия персонажей, чтобы строка шла без стыка
        const copy = track.firstElementChild.cloneNode(true)
        copy.setAttribute('aria-hidden', 'true')
        track.append(copy)
    })

    const items = document.querySelectorAll('.hero-run__item')
    // считаем размеры, только пока первый экран виден
    const visibleRuns = new Set()
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) visibleRuns.add(entry.target)
            else visibleRuns.delete(entry.target)
        })
    })
    document.querySelectorAll('.hero-run').forEach((run) => observer.observe(run))

    const updateSizes = () => {
        const middle = window.innerWidth / 2
        // сначала читаем все позиции, потом пишем размеры, чтобы не дёргать раскладку
        const centers = Array.from(items, (item) => {
            const box = item.getBoundingClientRect()
            return box.width ? box.left + box.width / 2 : null
        })

        items.forEach((item, index) => {
            if (centers[index] === null) return
            // в макете персонажи дорастают до полного размера примерно на 60% пути к краю
            const distance = Math.min(Math.abs(centers[index] - middle) / (middle * HERO_FULL_SIZE_AT), 1)
            item.style.scale = HERO_SMALLEST_SCALE + (1 - HERO_SMALLEST_SCALE) * distance ** 2
        })
    }

    const loop = () => {
        if (visibleRuns.size) updateSizes()
        requestAnimationFrame(loop)
    }

    if (isReducedMotion) {
        updateSizes()
        window.addEventListener('resize', updateSizes)
    } else {
        loop()
    }
}

// Экран 4: карточки интерактивов сворачиваются по кнопке «+»
function initTopics() {
    document.querySelectorAll('.js-topic-toggle').forEach((button) => {
        const topic = button.closest('.topic')
        const title = topic.querySelector('h3 img').alt

        topic.addEventListener('click', (event) => {
            if (event.target.closest('a')) return

            const isOpen = topic.classList.toggle('is-open')
            button.setAttribute('aria-expanded', String(isOpen))
            button.setAttribute('aria-label', `${isOpen ? 'Свернуть' : 'Развернуть'} «${title}»`)
        })
    })
}

// Истории: варианты ответа, выбрать можно один
function initChoices() {
    document.querySelectorAll('.js-choices').forEach((group) => {
        const options = group.querySelectorAll('[aria-pressed]')

        options.forEach((option) => {
            option.addEventListener('click', () => {
                options.forEach((other) => other.setAttribute('aria-pressed', String(other === option)))
            })
        })
    })
}

// Истории: «разбор» по нажатию, повторное нажатие прячет подсказку
function initReveals() {
    document.querySelectorAll('.js-reveal').forEach((button) => {
        button.addEventListener('click', () => {
            button.setAttribute('aria-pressed', String(button.getAttribute('aria-pressed') !== 'true'))
        })
    })
}

// Персонажи: короткая смешная анимация по клику
function initCharacters() {
    document.querySelectorAll('.character').forEach((character) => {
        character.addEventListener('click', () => {
            character.classList.remove('is-playing')
            // перезапуск анимации, если кликнули ещё раз
            void character.offsetWidth
            character.classList.add('is-playing')
        })

        character.addEventListener('animationend', (event) => {
            if (event.animationName === 'character-play') character.classList.remove('is-playing')
        })
    })
}

// Экран 6: проверка почты и отправка формы.
// Бэкенд подключается через action формы; без него успех не показываем.
function initSubscribeForm() {
    const form = document.querySelector('.js-subscribe-form')
    // на страницах без формы (например, «истории») подписки нет
    if (!form) return

    const input = form.querySelector('input[type="email"]')
    const button = form.querySelector('[type="submit"]')
    const status = document.querySelector('.js-form-status')

    const showStatus = (text, state) => {
        status.textContent = text
        status.classList.toggle('is-success', state === 'success')
        form.classList.toggle('is-error', state === 'error')
        form.classList.toggle('is-success', state === 'success')
        input.setAttribute('aria-invalid', String(state === 'error'))
    }

    input.addEventListener('input', () => {
        if (form.classList.contains('is-error')) showStatus('', null)
    })

    form.addEventListener('submit', async (event) => {
        event.preventDefault()
        const email = input.value.trim()

        if (!EMAIL_PATTERN.test(email)) {
            showStatus(email ? 'проверь почту: похоже, в ней опечатка' : 'введи почту', 'error')
            input.focus()
            return
        }

        if (!form.getAttribute('action')) {
            showStatus('форма пока не подключена к серверу', 'error')
            return
        }

        button.disabled = true

        try {
            const response = await fetch(form.action, {
                method: 'POST',
                body: new FormData(form),
                headers: { Accept: 'application/json' },
            })

            if (!response.ok) throw new Error(response.status)

            form.reset()
            showStatus('', 'success')
            openModal()
        } catch (error) {
            showStatus('не получилось отправить, попробуй ещё раз', 'error')
        } finally {
            button.disabled = false
        }
    })
}

// Экран 11: окно «ты в списке!»
function initModal() {
    if (!modal) return

    modal.querySelectorAll('.js-modal-close').forEach((button) => {
        button.addEventListener('click', closeModal)
    })

    modal.addEventListener('click', (event) => {
        if (event.target === modal) closeModal()
    })

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !modal.hidden) closeModal()
    })
}

function openModal() {
    lastFocused = document.activeElement
    modal.hidden = false
    document.body.classList.add('is-locked')

    requestAnimationFrame(() => {
        modal.classList.add('is-open')
        modal.querySelector('.modal__window').focus()
    })
}

function closeModal() {
    modal.classList.remove('is-open')
    document.body.classList.remove('is-locked')

    const hide = () => {
        modal.hidden = true
        if (lastFocused) lastFocused.focus()
    }

    setTimeout(hide, isReducedMotion ? 0 : 250)
}
