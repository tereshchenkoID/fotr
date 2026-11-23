import Image from 'next/image'

import { art } from '@/game/content/assets'

const images = {
  ember: '/art/symbols/gandalf/flame.webp',
  westStar: '/art/symbols/aragorn/star.webp',
  mountainKey: '/art/symbols/bilbo/key.webp',
  crown: '/art/symbols/thorin/crown.webp',
}

const ArtifactArt = ({ id, className }) => (
  <Image
    className={className}
    src={images[id] || art.symbolFallback}
    alt=""
    width={96}
    height={96}
  />
)

export default ArtifactArt
